import geolib from "geolib";
import jwt from "jsonwebtoken";
import logger from "../config/logger.js";
import User from "../models/User.js";
import Ride from "../models/Ride.js";
import FoodOrder from "../models/FoodOrder.js";
import ChatMessage from "../models/ChatMessage.js";

const CHAT_HISTORY_LIMIT = 100;

const onDutyRiders = new Map();

const handleSocketConnection = (io) => {
  io._onDutyRiders = onDutyRiders;

  io.use(async (socket, next) => {
    try {
      if (!process.env.ACCESS_TOKEN_SECRET) {
        return next(new Error("Server configuration error"));
      }
      const token = socket.handshake.headers.access_token;
      if (!token) return next(new Error("Authentication invalid: No token"));

      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(payload.id);
      if (!user) return next(new Error("Authentication invalid: User not found"));

      socket.user = { id: payload.id, role: user.role };
      next();
    } catch (error) {
      logger.error({ err: error }, "Socket authentication error");
      next(new Error("Authentication invalid: Token verification failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    const activeIntervals = new Set();
    const searchIntervalsByRideId = new Map();
    logger.info({ userId: user.id, role: user.role }, "User connected");

    if (user.role === "rider") {
      socket.join(`courier_${user.id}`);
      socket.on("goOnDuty", (coords) => {
        onDutyRiders.set(user.id, { socketId: socket.id, coords });
        socket.join("onDuty");
        logger.info({ riderId: user.id, coords }, "Rider on duty");
        logger.debug({ count: onDutyRiders.size }, "On-duty riders count");
        updateNearbyriders();
      });

      socket.on("goOffDuty", () => {
        onDutyRiders.delete(user.id);
        socket.leave("onDuty");
        logger.info({ riderId: user.id }, "Rider off duty");
        logger.debug({ count: onDutyRiders.size }, "On-duty riders count");
        updateNearbyriders();
      });

      socket.on("updateLocation", (coords) => {
        if (onDutyRiders.has(user.id)) {
          onDutyRiders.get(user.id).coords = coords;
          logger.debug({ riderId: user.id, coords }, "Rider location updated");
          updateNearbyriders();
          socket.to(`rider_${user.id}`).emit("riderLocationUpdate", {
            riderId: user.id,
            coords,
          });
        }
      });
    }

    if (user.role === "customer") {
      socket.on("subscribeToZone", (customerCoords) => {
        socket.user.coords = customerCoords;
        sendNearbyRiders(socket, customerCoords);
      });

      socket.on("searchrider", async (rideId) => {
        try {
          const ride = await Ride.findById(rideId).populate("customer rider");
          if (!ride) {
            logger.debug({ rideId }, "Ride not found");
            return socket.emit("error", { message: "Ride not found" });
          }

          const { latitude: pickupLat, longitude: pickupLon } = ride.pickup;
          logger.debug({ pickupLat, pickupLon }, "Searching for riders");
          logger.debug({ count: onDutyRiders.size }, "Riders on duty");

          let retries = 0;
          let canceled = false;
          const MAX_RETRIES = 20;
          let retryInterval;

          const retrySearch = async () => {
            if (canceled) return;
            retries++;
            
            logger.debug({ retries, MAX_RETRIES, rideId }, "Retry search");

            const riders = sendNearbyRiders(socket, { latitude: pickupLat, longitude: pickupLon }, ride);
            logger.debug({ riderCount: riders.length, rideId }, "Found nearby riders");
            
            if (riders.length > 0 || retries >= MAX_RETRIES) {
              if (retryInterval) {
                clearInterval(retryInterval);
                activeIntervals.delete(retryInterval);
              }
              if (retries >= MAX_RETRIES) {
                logger.debug({ rideId }, "Max retries reached");
                const latestRide = await Ride.findById(rideId).select("status");
                if (
                  latestRide &&
                  ["SEARCHING_FOR_RIDER", "AWAITING_OFFERS"].includes(latestRide.status)
                ) {
                  await Ride.findByIdAndDelete(rideId);
                  socket.emit("error", { message: "No riders found within 5 minutes." });
                }
              }
            }
          };

          retrySearch();
          retryInterval = setInterval(retrySearch, 10000);
          activeIntervals.add(retryInterval);
          searchIntervalsByRideId.set(rideId.toString(), {
            intervalId: retryInterval,
            markCanceled: () => {
              canceled = true;
            },
          });
        } catch (error) {
          logger.error({ err: error }, "Error searching for rider");
          socket.emit("error", { message: "Error searching for rider" });
        }
      });

      socket.on("cancelRide", async (rideId) => {
        try {
          if (!rideId) {
            socket.emit("error", { message: "Ride ID is required to cancel" });
            return;
          }

          const ride = await Ride.findOne({ _id: rideId, customer: user.id }).populate("rider");
          if (!ride) {
            socket.emit("error", { message: "Ride not found" });
            return;
          }

          if (!["SEARCHING_FOR_RIDER", "AWAITING_OFFERS"].includes(ride.status)) {
            socket.emit("error", { message: "Ride can no longer be canceled at this stage" });
            return;
          }

          const activeSearch = searchIntervalsByRideId.get(rideId.toString());
          if (activeSearch?.intervalId) {
            clearInterval(activeSearch.intervalId);
            activeIntervals.delete(activeSearch.intervalId);
          }
          if (activeSearch?.markCanceled) {
            activeSearch.markCanceled();
          }
          searchIntervalsByRideId.delete(rideId.toString());

          await Ride.findByIdAndDelete(rideId);
          socket.emit("rideCanceled", { message: "Ride canceled" });

          if (ride.rider?._id) {
            const riderSocket = getRiderSocket(ride.rider._id);
            riderSocket?.emit("rideCanceled", { message: `Customer ${user.id} canceled the ride.` });
          }

          logger.info({ userId: user.id, rideId }, "Customer canceled ride");
        } catch (error) {
          logger.error({ err: error, rideId }, "Cancel ride failed");
          socket.emit("error", { message: "Failed to cancel ride" });
        }
      });
    }

    socket.on("subscribeToriderLocation", (riderId) => {
      const rider = onDutyRiders.get(riderId);
      if (rider) {
        socket.join(`rider_${riderId}`);
        socket.emit("riderLocationUpdate", { riderId, coords: rider.coords });
        logger.debug({ userId: user.id, riderId }, "Subscribed to rider location");
      }
    });

    socket.on("subscribeRide", async (rideId) => {
      socket.join(`ride_${rideId}`);
      try {
        const rideData = await Ride.findById(rideId).populate("customer rider");
        socket.emit("rideData", rideData);
      } catch (error) {
        socket.emit("error", { message: "Failed to receive ride data" });
      }
    });

    socket.on("subscribeOrder", async (orderId) => {
      try {
        const order = await FoodOrder.findById(orderId).select("customerId courierId");
        if (!order) {
          socket.emit("error", { message: "Order not found" });
          return;
        }
        const userId = user.id.toString();
        const isCustomer = order.customerId && order.customerId.toString() === userId;
        const isCourier = order.courierId && order.courierId.toString() === userId;
        if (!isCustomer && !isCourier) {
          socket.emit("error", { message: "Not authorized to track this order" });
          return;
        }
        socket.join(`order_${orderId}`);
        logger.debug({ userId: user.id, orderId }, "Subscribed to order");
      } catch (error) {
        logger.error({ err: error, orderId }, "subscribeOrder failed");
        socket.emit("error", { message: "Failed to subscribe to order" });
      }
    });

    socket.on("unsubscribeOrder", (orderId) => {
      socket.leave(`order_${orderId}`);
    });

    socket.on("sendChatMessage", async ({ rideId, message, recipientRole }) => {
      try {
        const ride = await Ride.findById(rideId).select("customer rider");
        if (!ride) {
          socket.emit("error", { message: "Ride not found" });
          return;
        }

        const isParticipant =
          ride.customer?.toString() === user.id.toString() ||
          ride.rider?.toString() === user.id.toString();
        if (!isParticipant) {
          socket.emit("error", { message: "Not authorized for this ride chat" });
          return;
        }

        const saved = await ChatMessage.create({
          rideId,
          senderId: user.id,
          senderRole: user.role,
          text: message,
        });

        const chatData = {
          _id: saved._id,
          rideId,
          text: message,
          senderId: user.id,
          senderRole: user.role,
          timestamp: saved.createdAt,
        };

        io.to(`ride_${rideId}`).emit("chatMessage", chatData);
      } catch (error) {
        logger.error({ err: error }, "sendChatMessage failed");
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("getChatHistory", async (rideId) => {
      try {
        const messages = await ChatMessage.find({ rideId })
          .sort({ createdAt: 1 })
          .limit(CHAT_HISTORY_LIMIT)
          .lean();
        socket.emit("chatHistory", { rideId, messages });
      } catch (error) {
        logger.error({ err: error, rideId }, "getChatHistory failed");
        socket.emit("chatHistory", { rideId, messages: [] });
      }
    });

    socket.on("message:send", async ({ recipientId, text, orderId }) => {
      if (!text || !text.trim()) return;
      try {
        const saved = await ChatMessage.create({
          orderId: orderId || null,
          senderId: user.id,
          recipientId: recipientId || null,
          senderRole: user.role,
          text: text.trim(),
        });

        const payload = {
          _id: saved._id,
          senderId: user.id,
          recipientId,
          text: saved.text,
          timestamp: saved.createdAt,
        };

        socket.emit("message:received", payload);

        const recipientSocket = findUserSocket(recipientId);
        if (recipientSocket) {
          recipientSocket.emit("message:received", payload);
        }
      } catch (error) {
        logger.error({ err: error }, "message:send failed");
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("message:history", async ({ recipientId, orderId }) => {
      try {
        const query = orderId
          ? { orderId }
          : {
              $or: [
                { senderId: user.id, recipientId },
                { senderId: recipientId, recipientId: user.id },
              ],
            };
        const messages = await ChatMessage.find(query)
          .sort({ createdAt: 1 })
          .limit(CHAT_HISTORY_LIMIT)
          .lean();
        socket.emit("message:historyLoaded", { messages });
      } catch (error) {
        logger.error({ err: error }, "message:history failed");
        socket.emit("message:historyLoaded", { messages: [] });
      }
    });

    socket.on("disconnect", () => {
      for (const id of activeIntervals) {
        clearInterval(id);
      }
      activeIntervals.clear();
      searchIntervalsByRideId.clear();
      if (user.role === "rider") onDutyRiders.delete(user.id);
      logger.info({ userId: user.id, role: user.role }, "User disconnected");
    });

    function updateNearbyriders() {
      io.sockets.sockets.forEach((socket) => {
        if (socket.user?.role === "customer") {
          const customerCoords = socket.user.coords;
          if (customerCoords) sendNearbyRiders(socket, customerCoords);
        }
      });
    }

    function sendNearbyRiders(socket, location, ride = null) {
      const nearbyriders = Array.from(onDutyRiders.values())
        .map((rider) => ({
          ...rider,
          distance: geolib.getDistance(rider.coords, location),
        }))
        .filter((rider) => rider.distance <= 60000)
        .sort((a, b) => a.distance - b.distance);

      socket.emit("nearbyriders", nearbyriders);

      if (ride) {
        const topRiders = nearbyriders.slice(0, Math.min(10, nearbyriders.length));
        
        logger.info({ rideId: ride._id, riderCount: topRiders.length }, "Broadcasting ride offer");
        
        const rideData = ride.toObject ? ride.toObject() : ride;
        
        topRiders.forEach((rider, index) => {
          setTimeout(() => {
            const rideOffer = {
              ...rideData,
              pickupDistance: (rider.distance / 1000).toFixed(2),
              estimatedPickupTime: Math.ceil(rider.distance / 500),
            };
            
            io.to(rider.socketId).emit("rideOffer", rideOffer);
            logger.debug({ socketId: rider.socketId, rideId: ride._id }, "Ride offer sent to rider");
          }, index * 500);
        });
      }

      return nearbyriders;
    }

    function getRiderSocket(riderId) {
      const rider = onDutyRiders.get(riderId);
      return rider ? io.sockets.sockets.get(rider.socketId) : null;
    }

    function findUserSocket(userId) {
      const targetId = userId?.toString();
      for (const [, s] of io.sockets.sockets) {
        if (s.user?.id?.toString() === targetId) return s;
      }
      return null;
    }
  });
};

export default handleSocketConnection;
