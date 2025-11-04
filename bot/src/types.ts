export interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  links?: Array<{
    number: string;
    title: string;
    url: string;
  }>;
  sources?: string[];
  detectedLanguage?: string;
  confidence?: number;
}


