import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GeminiService, ScriptInputs } from './services/gemini.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent {
  private fb = inject(FormBuilder);
  private geminiService = inject(GeminiService);

  form: FormGroup;
  
  // Signals for state management
  generatedScript = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Dropdown options
  clientTypes = ['استثمار (Investment)', 'سكن عائلي (Family Home)', 'VIP / Luxury'];
  angles = [
    'غلطة شائعة (Common Mistake)', 
    'مقارنة (Comparison)', 
    'فلترة (Filtering)', 
    'تحذير (Warning)', 
    'نصيحة قرار (Decision Advice)'
  ];
  durations = ['30', '45', '60'];

  // Parsed sections for better UI display
  parsedSections = signal<any[]>([]);

  constructor() {
    this.form = this.fb.group({
      clientType: [this.clientTypes[0], Validators.required],
      area: ['', [Validators.required, Validators.minLength(2)]],
      angle: [this.angles[0], Validators.required],
      duration: ['30', Validators.required]
    });
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.generatedScript.set(null);
    this.parsedSections.set([]);

    const inputs: ScriptInputs = {
      clientType: this.form.value.clientType,
      area: this.form.value.area,
      angle: this.form.value.angle,
      duration: this.form.value.duration
    };

    try {
      const script = await this.geminiService.generateScript(inputs);
      this.generatedScript.set(script);
      this.parseScript(script);
    } catch (err) {
      this.error.set('حدث خطأ غير متوقع. تأكد من إعدادات المفتاح أو حاول مرة أخرى.');
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Helper to parse the numbered sections for cards
  private parseScript(text: string) {
    // Regex to split by "1) ", "2) ", etc. roughly
    const pattern = /(\d\)\s+[A-Z\s]+(?:\n|$))/g;
    const parts = text.split(pattern);
    
    // The split result alternates between content and delimiters. 
    // We need to reconstruct.
    // However, a simpler way for display is just treating the whole thing as text 
    // or doing basic header detection.
    
    // Let's try a simpler manual parsing line by line or block by block for robustness.
    const sections: {title: string, content: string}[] = [];
    
    // Normalize newlines
    const lines = text.split('\n');
    let currentTitle = '';
    let currentContent: string[] = [];

    const sectionHeaders = [
      'HOOK', 'VOICEOVER SCRIPT', 'SHOT LIST', 'CTA DM', 
      'CAPTION', 'HASHTAGS', '3 ALTERNATIVE HOOKS', '3 ALTERNATIVE CTAS',
      'PEXELS VIDEO SEARCH KEYWORDS',
      'بدائل HOOK', 'بدائل CTA' // Arabic fallback just in case
    ];

    lines.forEach(line => {
      const trimmed = line.trim();
      // Check if line starts with a number followed by )
      const isHeader = /^\d+\)/.test(trimmed);

      if (isHeader) {
        if (currentTitle) {
          sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
        }
        currentTitle = trimmed;
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    });

    // Push the last section
    if (currentTitle) {
      sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
    }

    if (sections.length === 0) {
      // Fallback if parsing fails
      sections.push({ title: 'Full Script', content: text });
    }

    this.parsedSections.set(sections);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast here, but simple is fine
      alert('تم نسخ النص!');
    });
  }
}