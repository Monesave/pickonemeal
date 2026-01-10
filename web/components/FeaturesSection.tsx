"use client";

export default function FeaturesSection() {
  const features = [
    {
      icon: "👆",
      title: "Swipe to Decide",
      description:
        "Swipe right to like, left to dislike, or down to skip. Simple and intuitive meal selection.",
    },
    {
      icon: "👨‍👩‍👧‍👦",
      title: "Dining Tables",
      description:
        "Create shared spaces where family and friends vote together on meals for specific dates.",
    },
    {
      icon: "🆓",
      title: "Free to Join",
      description:
        "Join Dining Tables for free. Only table creators need a subscription to unlock premium features.",
    },
    {
      icon: "⏰",
      title: "Auto-Decide",
      description:
        "Can't agree? After 1 hour, the app automatically picks a meal from your favorites.",
    },
    {
      icon: "🥗",
      title: "Dietary Preferences",
      description:
        "Set preferences like vegan, gluten-free, or halal to filter meals to your liking.",
    },
    {
      icon: "📊",
      title: "Meal History",
      description:
        "Subscribers get access to 1-month meal history for all their Dining Tables.",
    },
  ];

  return (
    <section id="features" className="relative py-24 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Why Pick One Meal?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-400">
            Everything you need to make meal decisions easy and fun for everyone.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group animate-fade-in-up rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 backdrop-blur-sm transition hover:border-emerald-500/50 hover:bg-neutral-900/80"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 text-4xl">{feature.icon}</div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-neutral-400">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Pricing highlight */}
        <div className="mt-16 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 p-8 text-center backdrop-blur-sm">
          <h3 className="mb-2 text-2xl font-bold text-white">
            Start Free, Upgrade When Ready
          </h3>
          <p className="mb-4 text-neutral-300">
            Free users can swipe, plan solo meals, and join tables. Subscribe
            for just £1.99/month to create Dining Tables and unlock meal
            history.
          </p>
          <div className="text-3xl font-bold text-emerald-400">£1.99/month</div>
        </div>
      </div>
    </section>
  );
}

