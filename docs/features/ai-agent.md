# AI Agent Integration

## Overview

The admin dashboard includes an AI agent powered by OpenAI's Agents API (GPT-4). It can process KYC submissions, detect fraud, and provide analytics.

## Setup

1. Add `OPENAI_API_KEY` to `server/.env`
2. Restart the server

## Usage

Access: purple sparkle button in the bottom-right corner of the admin dashboard.

## Agent Tools

| Tool | Description |
|------|-------------|
| get_pending_kyc | Fetch all KYC submissions awaiting review |
| approve_kyc | Approve a KYC submission (userId) |
| reject_kyc | Reject a KYC submission (userId, reason) |
| get_platform_stats | Total users, riders, customers, rides, revenue |
| get_recent_rides | Recent rides (default 10) |
| detect_fraud | Analyze user patterns for fraud (userId) |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /agent/chat | Admin | Chat with agent (body: message) |
| POST | /agent/init | Admin | Initialize agent |
| POST | /agent/auto-kyc | Admin | Auto-process all pending KYC |
| GET | /agent/suggestions | Admin | AI-generated platform improvement suggestions |

### POST /agent/chat

Request: `{ "message": "Analyze pending KYC submissions" }`

Response: `{ "success": true, "response": "..." }`

### POST /agent/auto-kyc

Runs automatic KYC processing. Returns summary of approvals and rejections.

### GET /agent/suggestions

Returns 3-5 actionable suggestions for operations, revenue, or UX.

## Example Conversations

**KYC:** "How many KYC submissions are pending?" then "Yes, analyze all of them" then "Approve the valid ones"

**Fraud:** "Are there any suspicious users I should know about?" then "Flag user ABC123 for review"

**Analytics:** "What's our revenue trend this month?" or "Which vehicle type generates most revenue?"

## Cost Estimation (GPT-4)

- Input: ~$0.01 per 1K tokens
- Output: ~$0.03 per 1K tokens
- Single KYC review: ~$0.02
- Auto-process 10 KYC: ~$0.20
- Platform analysis: ~$0.05
- Daily operations: ~$2-5/day

## Security

- Never commit `.env`; rotate keys periodically
- Only admin users can access agent; JWT required
- Agent does not store sensitive data permanently
- Review OpenAI data usage policy
