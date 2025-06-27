import { supabase } from './supabase';

interface StoryGenerationParams {
  seed: string;
  history: string[];
}

interface StoryGenerationResponse {
  story: string;
  choices: string[];
}

interface SpeechToTextParams {
  audioData: string; // Base64 encoded audio
  storyContext?: string;
  language?: "en" | "tl" | "zh" | "yue"; // en=English, tl=Tagalog, zh=Mandarin, yue=Cantonese
}

interface SpeechToTextResponse {
  transcript: string;
}

interface TextToSpeechParams {
  text: string;
  voiceType?: 'narrator' | 'child' | 'fairy';
}

interface TextToSpeechResponse {
  audioData: string;
  audioUrl: string;
}

interface ImageGenerationParams {
  prompt: string;
  width?: number;
  height?: number;
}

interface ImageGenerationResponse {
  imageUrl: string;
}

export class EdgeFunctions {
  private static async invoke<T>(functionName: string, body: any): Promise<T> {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as T;
  }

  static async generateStory(params: StoryGenerationParams): Promise<StoryGenerationResponse> {
    return this.invoke<StoryGenerationResponse>('generate-story', params);
  }

  static async speechToText(params: SpeechToTextParams): Promise<SpeechToTextResponse> {
    return this.invoke<SpeechToTextResponse>('speech-to-text', params);
  }

  static async textToSpeech(params: TextToSpeechParams): Promise<TextToSpeechResponse> {
    return this.invoke<TextToSpeechResponse>('text-to-speech', params);
  }

  static async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResponse> {
    return this.invoke<ImageGenerationResponse>('generate-image', params);
  }
}