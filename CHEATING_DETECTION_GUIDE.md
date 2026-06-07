# Cheating Detection System - Complete Guide

## Overview
This document explains the complete cheating detection system and what items are prohibited during exams.

---

## Detected Violations

### 1. **No Face Detection**
- **What it detects**: Student's face is not visible in the camera
- **Trigger**: Face detection model doesn't detect a "person" class object
- **Action**: Records as `noFaceCount` violation

### 2. **Multiple Faces Detection**
- **What it detects**: More than one person visible in the camera
- **Trigger**: Multiple "person" class objects detected
- **Action**: Records as `multipleFaceCount` violation

### 3. **Cell Phone Detection** ⚠️ VIOLATION
- **What it detects**: Mobile phone/cell phone in frame
- **Trigger**: COCO-SSD detects "cell phone" class
- **Action**: Records as `cellPhoneCount` violation
- **Note**: Cell phone is a standalone violation category (NOT part of prohibited objects)

### 4. **Prohibited Objects Detection** 📖 SPECIFIC ITEMS ONLY
- **Prohibited Items**:
  - 📖 **Book** - Any physical book, notebook, or reference material
  - 💻 **Laptop** - Computer, MacBook, or any laptop device

- **How it works**: COCO-SSD detects these specific objects
- **Action**: Records as `prohibitedObjectCount` violation

#### ❌ What is NOT Prohibited:
- ✅ Cell phone (separate violation)
- ✅ Pen/Pencil
- ✅ Water bottle
- ✅ Monitor/Screen (external display for code/reference is not blocked)
- ✅ Keyboard
- ✅ Mouse
- ✅ Headphones (if used for exam audio)

### 5. **External Noise Detection** 🔊 NEW
- **What it detects**: Microphone picks up external noise or unusual audio levels
- **Trigger**: Audio frequency analysis shows noise above threshold (50dB)
- **Causes**:
  - Background conversations
  - TV or radio playing
  - Music or loud sounds
  - Microphone malfunction/feedback
  - Poor microphone quality
- **Action**: Records as `externalNoiseCount` violation

---

## Testing the System

### To Test Cell Phone Detection:
1. Bring a cell phone into the camera frame
2. Wait 3 seconds
3. Alert: "Cell Phone Detected - This is a violation!"
4. Screenshot captured automatically

### To Test Prohibited Objects:
1. Hold a **book** or **laptop** in frame
2. Wait 3 seconds
3. Alert: "Prohibited Object Detected (Book/Laptop)"
4. Screenshot captured automatically

### To Test External Noise Detection:
1. Make noise near the microphone (talk, clap, etc.)
2. Wait 3 seconds
3. Alert: "External Noise Detected - Microphone Issue or Background Noise"
4. Screenshot captured automatically

### To Test Face Detection:
1. Look away from camera → "Face Not Visible" alert
2. Get another person in frame → "Multiple Faces Detected" alert

---

## Teacher Dashboard - Cheating Table

The teacher's results section displays a violation count table with columns:

| Column | Description |
|--------|-------------|
| Sno | Serial number |
| Name | Student name |
| Email | Student email |
| No Face Count | Times face was not visible |
| Multiple Face Count | Times multiple people detected |
| Cell Phone Count | Times cell phone was detected (separate from prohibited) |
| Prohibited Object Count | Times book/laptop detected |
| External Noise Count | Times external noise detected |
| Screenshots | View violation screenshots with timestamps |

---

## Key Clarifications

### ❓ Why is Cell Phone a Separate Category?
- Cell phones are critical contraband during exams
- Separate tracking allows teachers to see this specific violation clearly
- Different from other prohibited items

### ❓ What Objects Can I Bring to Exam?
✅ Allowed:
- Pen/Pencil for notes (if using paper for rough work)
- Water bottle
- Eyeglasses/Contact lenses
- Headphones (for exam audio only)
- Computer mouse/keyboard (if you own the device)

❌ NOT Allowed:
- 📱 Cell phone (any mobile device)
- 📖 Books or notebooks
- 💻 Laptop (external to your test computer)
- Any written reference materials

### ❓ How Sensitive is Noise Detection?
- Threshold set to 50dB (normal conversation level)
- Adjustable in code if too sensitive/lenient
- Detects microphone issues and external noise

---

## Modifications Made (Latest Update)

### 1. **Teacher Results - MCQ Only Exams**
- ✅ Fixed: Coding columns now only show for exams that have coding questions
- Tabs dynamically shown based on exam types
- Prevents confusing empty columns

### 2. **External Noise Detection**
- ✅ Added: Microphone audio level monitoring
- Detects background noise and audio issues
- New `externalNoiseCount` field in database

### 3. **Prohibited Objects Clarification**
- ✅ Fixed: Cell phone no longer counted as "prohibited object"
- Cell phone has its own dedicated `cellPhoneCount`
- Only book/laptop count as prohibited objects
- Clear separation in alerts and data

---

## Database Schema

### CheatingLog Model Fields:
```
- noFaceCount: Number (default: 0)
- multipleFaceCount: Number (default: 0)
- cellPhoneCount: Number (default: 0)
- prohibitedObjectCount: Number (default: 0) // Book, Laptop
- externalNoiseCount: Number (default: 0) // NEW
- examId: String (required)
- email: String (required)
- username: String (required)
- screenshots: Array [
    - url: String (Uploadcare CDN URL)
    - type: Enum (noFace, multipleFace, cellPhone, prohibitedObject, externalNoise)
    - detectedAt: Date
  ]
```

---

## Screenshots

All violations automatically capture and upload screenshots to Uploadcare with:
- Timestamp of detection
- Type of violation
- URL for teacher review in dashboard

---

## FAQ

**Q: Can I use my phone for the exam?**
A: No. Any cell phone in frame triggers a violation alert.

**Q: What if I need a calculator?**
A: Use a built-in calculator app on the exam computer, not a separate device.

**Q: What if there's background noise?**
A: The system will detect it. Find a quiet location or check your microphone.

**Q: Can I have a book visible behind me?**
A: Books should not be visible in the camera frame at all.

**Q: How many violations trigger an automatic fail?**
A: That's determined by the teacher/institution policy (not automated).

---

## Support

For technical issues with detection:
1. Check camera/microphone permissions
2. Test detection with known items (phone, book)
3. Verify good lighting for camera
4. Check microphone is not obstructed
