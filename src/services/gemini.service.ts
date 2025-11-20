
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { BrandIdentity } from '../models/brand-identity.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY environment variable not set');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateBrandIdentity(mission: string): Promise<BrandIdentity> {
    const brandIdentitySchema = {
      type: Type.OBJECT,
      properties: {
        colors: {
          type: Type.ARRAY,
          description: 'A vibrant 5-color palette. Include primary, secondary, accent, and neutral colors.',
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'e.g., "Primary Blue", "Muted Gray"' },
              hex: { type: Type.STRING, description: 'The hex code, e.g., "#FFFFFF"' },
              usage: { type: Type.STRING, description: 'Brief usage note, e.g., "For main calls-to-action"' },
            },
            required: ['name', 'hex', 'usage'],
          },
        },
        fonts: {
          type: Type.OBJECT,
          description: 'A pair of Google Fonts that complement each other, with a clean, modern, and friendly aesthetic similar to Google\'s typography (e.g., Roboto, Open Sans).',
          properties: {
            header: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'The header font name. Should be a clean, modern Google Font.' },
                importUrl: { type: Type.STRING, description: 'The full Google Fonts import URL for the font.' }
              },
              required: ['name', 'importUrl'],
            },
            body: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'The body font name. Should be a highly readable Google Font that pairs well with the header font.' },
                importUrl: { type: Type.STRING, description: 'The full Google Fonts import URL for the font.' }
              },
              required: ['name', 'importUrl'],
            },
          },
          required: ['header', 'body'],
        },
      },
      required: ['colors', 'fonts'],
    };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following company mission, generate a complete brand identity. Mission: "${mission}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: brandIdentitySchema,
        },
      });

      const jsonString = response.text.trim();
      const parsedResponse = JSON.parse(jsonString);

      // Basic validation
      if (!parsedResponse.colors || !parsedResponse.fonts) {
        throw new Error('Invalid response structure from API.');
      }

      return parsedResponse as BrandIdentity;
    } catch (error) {
      console.error('Error generating brand identity:', error);
      throw new Error('Failed to parse brand identity from AI response.');
    }
  }

  async generateLogos(mission: string): Promise<string[]> {
    const prompt = `A clean, modern, minimalist primary logo and two secondary brand marks/icons for a company with the mission: "${mission}". The logo and marks should be on a solid, simple background and be visually consistent.`;
    
    try {
        const response = await this.ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 3,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error('No images were generated.');
        }

        return response.generatedImages.map(img => img.image.imageBytes);
    } catch (error) {
        console.error('Error generating logos:', error);
        throw new Error('Failed to generate logos from AI response.');
    }
  }
}