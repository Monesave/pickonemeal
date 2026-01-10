"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "🍽️ What is Pick One Meal?",
    answer:
      "Pick One Meal is a swipe-based app that helps couples, families, and friends agree on one home-made meal—together or solo.",
  },
  {
    question: "👉 How does meal picking work?",
    answer:
      "You swipe through meal cards: Right to like, Left to dislike, Down to skip. In groups, a meal is confirmed only when everyone likes the same one.",
  },
  {
    question: "👨‍👩‍👧‍👦 What is a Dining Table?",
    answer:
      "A Dining Table is a shared space where invited people vote on a meal together for a specific date and meal (breakfast, lunch, or dinner).",
  },
  {
    question: "🆓 Can I use the app for free?",
    answer:
      "Yes! Free users can: Plan meals for themselves, Swipe and vote on meals, Join Dining Tables via invite links.",
  },
  {
    question: "💳 What do I get with the subscription?",
    answer:
      "For £1.99/month, subscribers can: Create Dining Tables, Invite others to vote together, Unlock 1-month meal history for everyone at their table. Only the table creator needs to subscribe.",
  },
  {
    question: "⏰ What if we can't agree on a meal?",
    answer:
      "If there's no match: The app shows runner-up meals or starts a revote. After 1 hour, the app automatically picks a meal for you.",
  },
  {
    question: "🔄 How many meals can I choose per day?",
    answer:
      "Each user can select up to 3 meals per day. You can also skip meals if you're undecided.",
  },
  {
    question: "🥗 Can I set dietary preferences?",
    answer:
      "Yes. You can set preferences like vegan, gluten-free, or halal to filter meals shown to you or your table.",
  },
  {
    question: "🔗 Is joining a Dining Table free?",
    answer:
      "Always. Joining a table is free—no subscription required. Subscription is required to create a dining table and menu. Subscription also comes with a whole load of benefits like meal planning and sharing. We plan to launch a pro version to allow you share your grandma's favourite recipe with your audience and get paid!",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-neutral-400">
            Everything you need to know about Pick One Meal
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm transition hover:border-neutral-700"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between p-6 text-left transition hover:bg-neutral-900/50"
              >
                <span className="pr-8 font-medium text-white">
                  {faq.question}
                </span>
                <span
                  className={`flex-shrink-0 text-2xl text-neutral-400 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-6 text-neutral-300">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

