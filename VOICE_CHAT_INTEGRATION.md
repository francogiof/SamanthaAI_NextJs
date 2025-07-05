# Voice Chat Integration for Screening Interface

## Overview
This document explains the integration of real-time voice chat functionality into the screening interface, based on the working implementation from the `assets/voice-chat` folder.

## Key Changes Made

### 1. Speech Recognition Implementation
- **Replaced MediaRecorder with Web Speech API**: The original implementation used MediaRecorder to capture audio and send it to Lemonfox STT API. This was replaced with the browser's built-in Web Speech API for more reliable real-time speech recognition.
- **Microphone Permission Handling**: Added proper permission checking and request flow before starting any speech functionality.

### 2. Visual Indicators
- **Audio Activity Indicators**: Added pulsing animations and visual feedback when:
  - Agent is speaking (TTS playing)
  - Candidate is speaking (speech recognition active)
  - Countdown before auto-starting speech recognition
- **Google Meet-style Visuals**: Circular avatars with pulsing effects and animated dots

### 3. Environment Variables
- **Unified API Key**: Both TTS and STT now use `LEMONFOX_TTS_KEY` environment variable
- **Configuration**: Make sure your `.env.local` file contains:
  ```
  LEMONFOX_TTS_KEY=your_lemonfox_api_key_here
  ```

## How It Works

### 1. Permission Flow
1. Component loads and checks microphone permission status
2. If permission is not granted, shows permission request screen
3. User must click "Allow Microphone Access" to proceed
4. Only after permission is granted does the interview start

### 2. Speech Recognition Flow
1. Agent speaks (TTS plays audio)
2. After agent finishes speaking, 3-second countdown starts
3. Speech recognition automatically starts after countdown
4. User speaks and speech is transcribed in real-time
5. Transcribed text is automatically sent as a message
6. Process repeats for next agent response

### 3. Visual Feedback
- **Agent Speaking**: Blue avatar turns green with pulsing effect + animated dots
- **User Speaking**: Green avatar with pulsing effect + animated dots
- **Countdown**: Yellow pulsing dot with countdown text
- **Permission Required**: Red microphone icon with clear instructions

## Files Modified

### Core Component
- `components/screening-interface.tsx`: Main component with speech recognition logic

### API Endpoints
- `app/api/speech/stt/route.ts`: Updated to use `LEMONFOX_TTS_KEY`
- `app/api/speech/tts/route.ts`: Already using correct environment variable

### Styling
- `components/screening-interface.css`: New CSS file with audio activity indicators

## Testing

### Environment Check
Visit `/api/test-env` to verify your environment variables are properly set.

### Manual Testing
1. Load the screening interface
2. Grant microphone permissions when prompted
3. Wait for agent to speak
4. Verify speech recognition starts automatically after countdown
5. Speak and verify transcription appears in chat
6. Check visual indicators are working

## Troubleshooting

### Common Issues

1. **"Speech recognition not supported"**
   - Use a modern browser (Chrome, Edge, Safari)
   - Ensure HTTPS is enabled (required for microphone access)

2. **"Microphone permission denied"**
   - Click the microphone icon in browser address bar
   - Allow microphone access
   - Refresh the page

3. **"STT service not configured"**
   - Check your `.env.local` file has `LEMONFOX_TTS_KEY`
   - Restart your development server after adding environment variables

4. **No visual indicators**
   - Ensure `screening-interface.css` is properly imported
   - Check browser console for CSS loading errors

### Debug Mode
The component includes extensive console logging. Open browser developer tools to see detailed logs of:
- Permission status changes
- Speech recognition events
- API calls and responses
- Visual state changes

## Browser Compatibility

- **Chrome**: Full support
- **Edge**: Full support  
- **Safari**: Full support
- **Firefox**: Limited support (may need fallback)

## Performance Notes

- Web Speech API provides real-time transcription
- No audio file uploads required
- Lower latency than server-side STT
- Works offline for speech recognition (TTS still requires API) 