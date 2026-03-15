/**
 * Article body content for Learn AI pages
 */

export function LearnAiContent({ slug }: { slug: string }) {
  switch (slug) {
    case "how-to-talk-to-ai":
      return (
        <div className="space-y-6 text-slate-700">
          <p>
            Talking to AI is a skill. The clearer you are, the better the results. Start with the basics: who you are, what you need, and how you want it delivered.
          </p>
          <h2 className="text-xl font-semibold text-slate-900">Start with context</h2>
          <p>
            Tell the AI who you are and what you&apos;re trying to do. &quot;I&apos;m a small business owner&quot; or &quot;I&apos;m writing a school essay&quot; helps it tailor the response.
          </p>
          <h2 className="text-xl font-semibold text-slate-900">Be specific about the task</h2>
          <p>
            Instead of &quot;help me with marketing,&quot; try &quot;Write 3 Instagram captions for a coffee shop. Tone: cozy and friendly. Max 150 characters each.&quot;
          </p>
          <h2 className="text-xl font-semibold text-slate-900">Specify the format</h2>
          <p>
            Say how you want the output: bullet points, a table, one paragraph, a list of 5 items. Format instructions reduce back-and-forth and get you usable results faster.
          </p>
        </div>
      );
    case "how-to-prompt-chatgpt":
      return (
        <div className="space-y-6 text-slate-700">
          <p>
            ChatGPT responds to structure. Use a simple framework: role, task, context, and format. The more you include, the better the output.
          </p>
          <h2 className="text-xl font-semibold text-slate-900">Give it a role</h2>
          <p>
            &quot;Act as a senior developer&quot; or &quot;You are a marketing copywriter&quot; sets the tone and expertise level. The AI will respond as if it has that background.
          </p>
          <h2 className="text-xl font-semibold text-slate-900">Define the task clearly</h2>
          <p>
            One clear sentence: &quot;Write 5 subject lines for an email about our new product launch.&quot; Avoid multiple tasks in one prompt; split them if needed.
          </p>
          <h2 className="text-xl font-semibold text-slate-900">Add context</h2>
          <p>
            Audience, tone, constraints: &quot;Audience: B2B SaaS buyers. Tone: professional but friendly. Avoid jargon.&quot; Context prevents generic or off-target answers.
          </p>
          <h2 className="text-xl font-semibold text-slate-900">Request a format</h2>
          <p>
            &quot;Output as a numbered list,&quot; &quot;Use bullet points,&quot; or &quot;One paragraph, max 100 words&quot; keeps the response usable without extra editing.
          </p>
        </div>
      );
    case "prompt-tips":
      return (
        <div className="space-y-6 text-slate-700">
          <p>
            These 10 tricks are used by power users to get consistent, high-quality AI outputs.
          </p>
          <ol className="list-decimal list-inside space-y-4">
            <li><strong>Role-play:</strong> Assign a role. &quot;You are a UX writer&quot; improves clarity and tone.</li>
            <li><strong>Give examples:</strong> Show 1–2 examples of the output you want. The AI will match the style.</li>
            <li><strong>Add constraints:</strong> &quot;Max 50 words,&quot; &quot;No bullet points,&quot; &quot;Begin with a question.&quot;</li>
            <li><strong>Be explicit about negatives:</strong> &quot;Don&apos;t use jargon&quot; or &quot;Avoid clichés.&quot;</li>
            <li><strong>Use step-by-step:</strong> &quot;First analyze X, then suggest Y, then summarize.&quot;</li>
            <li><strong>Specify audience:</strong> &quot;For beginners&quot; vs &quot;For experts&quot; changes depth and complexity.</li>
            <li><strong>Request alternatives:</strong> &quot;Give me 3 versions: formal, casual, and playful.&quot;</li>
            <li><strong>Ask for reasoning:</strong> &quot;Explain your reasoning&quot; or &quot;Show your work.&quot;</li>
            <li><strong>Iterate:</strong> Refine with follow-ups: &quot;Make it shorter&quot; or &quot;Add more examples.&quot;</li>
            <li><strong>Save what works:</strong> Keep a library of prompts that produce good results and reuse them.</li>
          </ol>
        </div>
      );
    case "prompt-frameworks":
      return (
        <div className="space-y-6 text-slate-700">
          <p>
            The ROLE, TASK, CONTEXT, FORMAT (RTCF) framework helps you structure prompts for consistent results.
          </p>
          <h2 className="text-xl font-semibold text-slate-900">ROLE</h2>
          <p>
            Who should the AI act as? &quot;Act as a financial advisor&quot; or &quot;You are a technical writer.&quot; This sets expertise and tone.
          </p>
          <h2 className="text-xl font-semibold text-slate-900">TASK</h2>
          <p>
            What exactly should it do? One clear action: &quot;Write a cold email&quot; or &quot;Summarize this article in 3 bullet points.&quot;
          </p>
          <h2 className="text-xl font-semibold text-slate-900">CONTEXT</h2>
          <p>
            Background, audience, constraints. &quot;Audience: startup founders. Product: project management tool. Keep it under 100 words.&quot;
          </p>
          <h2 className="text-xl font-semibold text-slate-900">FORMAT</h2>
          <p>
            How should the output look? &quot;5 bullet points,&quot; &quot;Table with 3 columns,&quot; or &quot;One paragraph.&quot;
          </p>
          <p>
            <strong>Example:</strong> &quot;Act as a social media manager (ROLE). Write 3 Instagram captions for a fitness brand (TASK). Audience: women 25–40, tone: motivational (CONTEXT). Max 150 chars each, include 2 emojis (FORMAT).&quot;
          </p>
        </div>
      );
    case "common-prompt-mistakes":
      return (
        <div className="space-y-6 text-slate-700">
          <p>
            These mistakes lead to generic, unusable, or inconsistent AI outputs. Fix them to get better results.
          </p>
          <h2 className="text-xl font-semibold text-slate-900">1. Too vague</h2>
          <p>
            &quot;Write something good&quot; or &quot;Help me with my business&quot; gives generic answers. Be specific: what exactly do you need, for whom, in what format?
          </p>
          <h2 className="text-xl font-semibold text-slate-900">2. Missing context</h2>
          <p>
            Without audience, tone, or constraints, the AI guesses. Add: &quot;For B2B buyers,&quot; &quot;Tone: professional,&quot; &quot;Max 100 words.&quot;
          </p>
          <h2 className="text-xl font-semibold text-slate-900">3. No format</h2>
          <p>
            Unspecified format leads to long paragraphs when you wanted bullets, or vice versa. Always say: &quot;Bullet points,&quot; &quot;Table,&quot; &quot;One sentence.&quot;
          </p>
          <h2 className="text-xl font-semibold text-slate-900">4. Too many tasks at once</h2>
          <p>
            One prompt, one main task. Split &quot;Write a blog post and create a social calendar and draft an email&quot; into separate prompts.
          </p>
          <h2 className="text-xl font-semibold text-slate-900">5. Not iterating</h2>
          <p>
            First outputs are rarely perfect. Use follow-ups: &quot;Make it shorter,&quot; &quot;Add more examples,&quot; &quot;Tone it down.&quot;
          </p>
        </div>
      );
    default:
      return null;
  }
}
