# RIDE App Design System

## Overview

The RIDE app uses a modern glassmorphism aesthetic with a green color palette. This document consolidates the design system, color scheme, typography, component specs, and implementation patterns.

---

## Design Philosophy

- **Glassmorphism**: Frosted glass effects with subtle transparency and blur
- **Modern UI**: Clean, minimalist interface with smooth shadows and rounded corners
- **Green Theme**: Fresh, eco-friendly color palette
- **Accessibility**: High contrast ratios and clear visual hierarchy (WCAG AA)

---

## Color Palette

### Primary
| Token | Hex | Usage |
|-------|-----|-------|
| primary | #10B981 | Main brand, CTAs, highlights |
| primaryDark | #059669 | Hover, pressed states |
| primaryLight | #34D399 | Backgrounds, accents |

### Neutral
| Token | Hex | Usage |
|-------|-----|-------|
| background | #F9FAFB | Main app background |
| backgroundDark | #111827 | Dark mode (future) |
| white | #FFFFFF | Cards, surfaces |
| text | #1F2937 | Primary text |
| textLight | #6B7280 | Secondary text, labels |

### Semantic
| Token | Hex |
|-------|-----|
| success | #10B981 |
| error | #EF4444 |
| warning | #F59E0B |
| info | #3B82F6 |

### Glass
| Token | Value |
|-------|-------|
| glass_bg | rgba(255,255,255,0.25) |
| glass_border | rgba(255,255,255,0.4) |
| glass_shadow | rgba(0,0,0,0.1) |

### Gradient
| Token | Hex |
|-------|-----|
| gradient_start | #10B981 |
| gradient_middle | #34D399 |
| gradient_end | #6EE7B7 |

---

## Typography

- **Font Family**: Noto Sans (Bold, SemiBold, Medium, Regular, Light)
- **Variants**: h2 through h8 for hierarchy
- **Line Height**: 20-24px for body text

```typescript
import CustomText from '@/components/shared/CustomText';

<CustomText variant="h2" fontFamily="Bold">Large Title</CustomText>
<CustomText variant="h5" fontFamily="SemiBold">Section Title</CustomText>
<CustomText variant="h6" fontFamily="Medium">Subtitle</CustomText>
<CustomText variant="h7" fontFamily="Regular">Body text</CustomText>
<CustomText variant="h8" fontFamily="Light">Small text</CustomText>
```

---

## Component Styling

### Buttons
- Border radius: 15px
- Height: 50px
- Shadow: soft, elevated
- Active state: 0.9 opacity on press

### Cards
- Border radius: 20px
- Shadow: elevated (`shadowOffset: { width: 0, height: 10 }`, `shadowOpacity: 0.15`, `shadowRadius: 20`)
- Background: white

### Inputs
- Border radius: 12px
- Border: 2px primary green
- Background: light green (#F0FDF4)
- Height: 50px
- Padding: 15px horizontal

### Bottom Sheets
- Top radius: 25px
- Shadow: upward for elevation
- Background: white with optional blur

---

## Shadow Patterns

### Standard (cards, buttons)
```typescript
shadowColor: Colors.glass_shadow,
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.15,
shadowRadius: 12,
elevation: 8
```

### Light (subtle elements)
```typescript
shadowColor: Colors.glass_shadow,
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.08,
shadowRadius: 6,
elevation: 3
```

### Heavy (floating elements)
```typescript
shadowColor: Colors.glass_shadow,
shadowOffset: { width: 0, height: 10 },
shadowOpacity: 0.15,
shadowRadius: 20,
elevation: 8
```

### Upward (bottom sheets)
```typescript
shadowColor: Colors.glass_shadow,
shadowOffset: { width: 0, height: -4 },
shadowOpacity: 0.15,
shadowRadius: 12,
elevation: 8
```

---

## Border Radius Guide

| Use | Value |
|-----|-------|
| Small elements (inputs, small cards) | 12 |
| Buttons | 15 |
| Cards | 20 |
| Bottom sheets (top corners) | 25 |
| Circular (avatars, icon buttons) | 100 |

---

## Gradient Usage

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/utils/Constants';

<LinearGradient
  colors={[Colors.gradient_start, Colors.gradient_middle, Colors.gradient_end]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={StyleSheet.absoluteFillObject}
/>
```

---

## Glass Effect

```typescript
import { BlurView } from 'expo-blur';

<BlurView intensity={40} tint="light" style={styles.glassContainer}>
  {/* Content */}
</BlurView>
```

Android fallback:
```typescript
Platform.OS === 'ios' ? (
  <BlurView intensity={40} tint="light">{/* Content */}</BlurView>
) : (
  <View style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>{/* Content */}</View>
)
```

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| Tight | 10 | Tight padding |
| Standard | 15 | Default padding |
| Comfortable | 20 | Card padding |
| Spacious | 30 | Section spacing |

---

## Common Patterns

### Screen Container
```typescript
<View style={{ flex: 1, backgroundColor: Colors.background }}>
  {/* Content */}
</View>
```

### Bottom Sheet
```typescript
<View style={{
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: Colors.white,
  borderTopLeftRadius: 25,
  borderTopRightRadius: 25,
  padding: 20,
  shadowColor: Colors.glass_shadow,
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 8,
}}>
  {/* Content */}
</View>
```

### Icon Button
```typescript
<TouchableOpacity style={{
  width: 40,
  height: 40,
  borderRadius: 100,
  backgroundColor: Colors.white,
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: Colors.glass_shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 4,
}}>
  <Icon name="icon-name" size={20} color={Colors.primary} />
</TouchableOpacity>
```

### List Item
```typescript
<TouchableOpacity style={{
  flexDirection: 'row',
  alignItems: 'center',
  padding: 15,
  backgroundColor: Colors.white,
  borderRadius: 15,
  marginVertical: 5,
  shadowColor: Colors.glass_shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
}}>
  {/* Content */}
</TouchableOpacity>
```

---

## Accessibility

- **Contrast**: Color contrast meets WCAG AA (e.g. text on white 14.5:1, green on white 3.2:1)
- **Touch targets**: Minimum 44x44 points
- **Labels**: Use `accessibilityLabel` and `accessibilityHint` on interactive elements
- **Semantic colors**: Convey meaning beyond color alone

```typescript
minHeight: 44,
minWidth: 44,
accessibilityLabel="Button description"
accessibilityHint="What happens when pressed"
```

---

## Usage

```typescript
import { Colors } from '@/utils/Constants';

// Use semantic names
backgroundColor: Colors.primary
color: Colors.text
borderColor: Colors.primary
```

Avoid hardcoded hex values; use `Colors.*` tokens for consistency.
