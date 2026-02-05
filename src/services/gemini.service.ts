import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

export interface ScriptInputs {
  clientType: string;
  area: string;
  angle: string;
  duration: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY']! });
  }

  async generateScript(inputs: ScriptInputs): Promise<string> {
    const systemPrompt = `
إنت كاتب سكريبتات ريلز عقاري مصري (Cairo / New Cairo).
هدفك تعمل ريل Organic بدون بيع مباشر.
المخرجات لازم تكون "جاهزة للتنفيذ" على InShot:
- جمل قصيرة
- كلام مصري طبيعي
- تقسيم زمني واضح
- نصوص شاشة قصيرة

اخرج النتيجة بهذا الشكل بالظبط (لا تضف أي مقدمات أو خاتمة، فقط المحتوى):

1) HOOK
(سطر واحد قوي لأول 2-3 ثواني)

2) VOICEOVER SCRIPT
(مصري، مقسم سطور قصيرة، وكل سطر قدامه زمن تقريبي بالثواني مثل [0-3])

3) SHOT LIST
(لقطة 1..لقطة N - وصف اللقطة + ON-SCREEN TEXT)

4) CTA DM
(سؤال واحد الناس تبعت بيه رسالة)

5) CAPTION
(سطرين)

6) HASHTAGS
(10-15)

7) 3 ALTERNATIVE HOOKS

8) 3 ALTERNATIVE CTAS

9) PEXELS VIDEO SEARCH KEYWORDS
قسّم الكلمات حسب كل لقطة، وكل لقطة فيها:
- الزمن (مثال: 0-3s)
- 3 إلى 5 كلمات بحث إنجليزي مناسبة لموقع Pexels Videos
لازم الكلمات تكون بسيطة، واضحة، ومناسبة لفيديوهات 3–6 ثواني.

ممنوع تقول: احجز الآن / عروض محدودة / أسعار.
لازم الكلام يبان خبرة ويعمل فلترة للعملاء.
    `;

    const userPrompt = `
المدخلات:
- نوع العميل: (${inputs.clientType})
- المنطقة/المشروع: (${inputs.area})
- زاوية الفيديو: (${inputs.angle})
- مدة الريل: (${inputs.duration} ثانية)
- ستايل: (خفيف ذكي + ثقة + من غير مبالغة)

اكتب السكريبت الآن.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + "\n" + userPrompt }] }
        ],
        config: {
          temperature: 0.7, // Creative but professional
        }
      });
      
      return response.text || "حدث خطأ أثناء توليد السكريبت. يرجى المحاولة مرة أخرى.";
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }
}