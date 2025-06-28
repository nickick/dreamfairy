import { EdgeFunctions } from "@/lib/edgeFunctions";
import { AudioModule, RecordingPresets, useAudioRecorder } from "expo-audio";
import * as FileSystem from "expo-file-system";
import { useEffect, useRef, useState } from "react";

interface UseSpeechToTextReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: (
    storyContext?: string,
    language?: "en" | "tl" | "zh" | "yue"
  ) => Promise<void>;
  clearTranscript: () => void;
}

export function useSpeechToText(): UseSpeechToTextReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Use the default HIGH_QUALITY preset which uses .m4a format
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listen to recording status changes
  useEffect(() => {
    const checkRecordingStatus = () => {
      // Update our state based on the recorder's actual state
      if (audioRecorder.isRecording !== isRecording) {
        console.log("Recording state changed:", {
          recorderState: audioRecorder.isRecording,
          ourState: isRecording,
          uri: audioRecorder.uri,
        });

        // Only update if we're not in the middle of starting/stopping
        if (!recordingTimeoutRef.current) {
          setIsRecording(audioRecorder.isRecording);
        }
      }
    };

    // Check status periodically
    const interval = setInterval(checkRecordingStatus, 100);

    return () => {
      clearInterval(interval);
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, [audioRecorder.isRecording, isRecording]);

  const startRecording = async () => {
    try {
      setError(null);

      // Check and request permissions
      console.log("Checking recording permissions...");
      let status = await AudioModule.getRecordingPermissionsAsync();
      console.log("Current permission status:", status);

      if (!status.granted) {
        console.log("Permission not granted, requesting...");
        status = await AudioModule.requestRecordingPermissionsAsync();
        console.log("Permission request result:", status);
      }

      if (!status.granted) {
        throw new Error(
          "Microphone permission not granted. Please enable microphone access in your device settings."
        );
      }

      // Configure audio for recording
      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Prepare recorder
      console.log("Preparing recorder...");
      await audioRecorder.prepareToRecordAsync();
      console.log("Recorder prepared");

      // Start recording - this starts the actual audio capture
      console.log("Starting recording...");
      audioRecorder.record();

      // Set a timeout to check if recording actually started
      recordingTimeoutRef.current = setTimeout(() => {
        console.log("Recording status check after timeout:", {
          isRecording: audioRecorder.isRecording,
          uri: audioRecorder.uri,
        });

        // If the recorder says it's not recording but we think it should be,
        // force our state to match the recorder
        if (!audioRecorder.isRecording) {
          console.warn("Recorder reports not recording, updating our state");
          setIsRecording(false);
        } else {
          // Double-check that we're actually recording
          setIsRecording(true);
        }

        recordingTimeoutRef.current = null;
      }, 1000);

      // Optimistically set recording state
      setIsRecording(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start recording";
      setError(errorMessage);
      console.error("Recording Error:", err);
      console.error("Full error details:", JSON.stringify(err, null, 2));

      // Add helpful message for common issues
      if (errorMessage.includes("permission")) {
        setError(
          errorMessage +
            " You may need to restart the app after granting permissions."
        );
      }

      setIsRecording(false);

      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
    }
  };

  const stopRecording = async (
    storyContext?: string,
    language: "en" | "tl" | "zh" | "yue" = "en"
  ) => {
    if (!isRecording) {
      console.log("Not recording, skipping stop");
      return;
    }

    try {
      // Clear any pending timeout
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      setIsRecording(false);

      // Stop recording first
      console.log("Stopping recording...");
      console.log("Recorder state before stop:", {
        isRecording: audioRecorder.isRecording,
        uri: audioRecorder.uri,
      });

      // Try to stop regardless of recorder state
      try {
        await audioRecorder.stop();
      } catch (stopError) {
        console.error("Error stopping recorder:", stopError);
      }

      // Get the URI from the recorder
      const uri = audioRecorder.uri;

      console.log("Recording stopped, URI:", uri);
      console.log("Recorder state after stop:", {
        isRecording: audioRecorder.isRecording,
        uri: audioRecorder.uri,
      });

      if (!uri) {
        throw new Error("No recording URI available");
      }

      // Wait longer to ensure file is fully written
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get file info to check format and size
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log("Recording file info:", fileInfo);

      if (!fileInfo.exists) {
        throw new Error("Recording file does not exist");
      }

      // Check for minimum file size (at least 10KB for a valid recording)
      if (fileInfo.size < 10000) {
        throw new Error(
          `Recording file is too small (${fileInfo.size} bytes). Please make sure you speak into the microphone and try recording again.`
        );
      }

      setIsTranscribing(true);

      // Read the audio file as base64
      console.log("Reading audio file...");
      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log("Audio base64 length:", audioBase64.length);

      // Clean up the audio file
      await FileSystem.deleteAsync(uri, { idempotent: true });

      // Send to Supabase edge function with language parameter
      const response = await EdgeFunctions.speechToText({
        audioData: audioBase64,
        storyContext,
        language,
      });

      setTranscript(response.transcript);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to transcribe audio"
      );
      console.error("Transcription Error:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setError(null);
  };

  return {
    isRecording,
    isTranscribing,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
  };
}
