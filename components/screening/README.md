# Screening Interface Module

This folder contains all components, hooks, types, and styles for the modularized screening interview interface.

## File/Component Dictionary

- **ScreeningInterface.tsx**: Main container, top-level state, context, and composition of subcomponents.
- **ScreeningHeader.tsx**: Header bar with title, timer, progress, and status indicators.
- **VideoSection.tsx**: Agent and candidate video, avatars, speaking timers, photo capture logic.
- **ChatSidebar.tsx**: Chat area, message list, progress bar, step indicators.
- **FloatingControls.tsx**: Floating controls (audio, mic, camera, CC, end call, device dropdowns).
- **SubtitlesOverlay.tsx**: CC/subtitles overlay, typewriter animation, message truncation.
- **hooks/useScreeningState.ts**: Screening session state/logic, initialization, progress, completion.
- **hooks/useMediaDevices.ts**: Camera/mic device management, permissions, toggling.
- **hooks/useSpeechRecognition.ts**: Speech recognition and TTS logic.
- **hooks/usePhotoCapture.ts**: Photo capture scheduling and logic.
- **types.ts**: Shared TypeScript types/interfaces (Message, AgentSlide, etc.).
- **screening-interface.module.css**: All CSS for the screening interface and subcomponents (migrated from screening-interface.css).

## Usage
Import and use `ScreeningInterface` as the main entry point. All subcomponents and hooks are internal to this folder.

## Notes
- Update all imports in the app to use this folder structure.
- Use the CSS module for all related styles.
- Extend types in `types.ts` as needed for new features.
