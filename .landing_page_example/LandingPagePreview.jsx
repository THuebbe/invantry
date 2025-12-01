import React from "react";
import {
	CircleDollarSign,
	CloudLightning,
	Trash2,
	Check,
	AlertTriangle,
	Zap,
	Target,
	Clock,
	CreditCard,
} from "lucide-react";

// ===== DATA =====
const valueProps = [
	{
		id: "predictable",
		icon: CircleDollarSign,
		title: "Predictable Food Costs",
		bullets: [
			"Get your food cost percentage under 30% (industry best practice)",
			"Know exactly what you're spending before you spend it",
			"Turn inventory from a guessing game into a profit center",
		],
	},
	{
		id: "shortages",
		icon: CloudLightning,
		title: "Zero Surprise Shortages",
		bullets: [
			"Never scramble to find emergency suppliers mid-service again",
			"Automatic alerts before you hit reorder points",
			"Sleep easy knowing tomorrow's prep is covered",
		],
	},
	{
		id: "waste",
		icon: Trash2,
		title: "Waste That Actually Goes to Zero",
		bullets: [
			"Stop throwing away hundreds (or thousands) in spoiled product",
			"Track expiration dates automatically",
			"Turn your walk-in from a black hole into a money-making machine",
		],
	},
];

const credentials = {
	headline: "Why We Built This",
	bodyCopy:
		"After dozens of conversations with restaurant operators—from single-location independents to multi-unit managers—we kept hearing the same frustration - I know I'm losing money on inventory, but I don't have time to fix it.",
	problem:
		"It's not that managers don't care. It's that existing solutions were built for retail warehouses, not restaurant kitchens. They're too complex, too time-consuming, and don't account for the chaos of service.",
	difference: [
		"Built specifically for restaurant workflows (not adapted from retail)",
		"Designed for speed—because you don't have 30 minutes for inventory counts",
		"Focuses on what matters: food cost, waste, and never running out mid-shift",
	],
	mission:
		"Give independent restaurants the inventory intelligence that only enterprise chains could afford—until now.",
};

const callToAction = {
	headline: "Start Your Free Assessment",
	buttonText: "Discover My Inventory Score",
	reasons: [
		{
			icon: Clock,
			heading: "Takes just 3 minutes",
			body: "No lengthy forms or complicated setup",
		},
		{
			icon: CreditCard,
			heading: "100% Free. No Credit Card.",
			body: "Get your personalized recommendations with zero commitment",
		},
		{
			icon: Zap,
			heading: "Instant Results",
			body: "See your Restaurant Readiness Score and get your custom action plan immediately",
		},
	],
	closing: "🔒 Your information is secure and will never be shared",
};

// ===== BUTTON COMPONENT =====
function Button({
	children,
	variant = "primary",
	size = "md",
	onClick,
	className = "",
}) {
	return (
		<button
			className={`btn btn--${variant} btn--${size} ${className}`}
			onClick={onClick}
		>
			{children}
		</button>
	);
}

// ===== VALUE PROP CARD =====
function ValuePropCard({ icon: Icon, title, bullets }) {
	return (
		<article className="value-card">
			<div
				className="value-card__glow"
				aria-hidden="true"
			></div>

			<header className="value-card__header">
				<div
					className="value-card__icon"
					aria-hidden="true"
				>
					<Icon size={32} />
				</div>
				<h3 className="value-card__title">{title}</h3>
			</header>

			<ul className="value-card__list">
				{bullets.map((bullet, index) => (
					<li
						key={index}
						className="value-card__item"
					>
						<span
							className="value-card__check"
							aria-hidden="true"
						>
							<Check
								size={16}
								strokeWidth={3}
							/>
						</span>
						<span className="value-card__text">{bullet}</span>
					</li>
				))}
			</ul>
		</article>
	);
}

// ===== HERO SECTION =====
function Hero() {
	return (
		<section className="hero">
			<div className="hero__background">
				<div className="hero__overlay"></div>
			</div>

			<div className="hero__content">
				<div className="hero__text">
					<h1 className="hero__headline">
						Ready to Master Your Kitchen's Inventory in 90 Days or Less?
					</h1>
					<p className="hero__subheadline">
						Take our 3-minute Restaurant Readiness Assessment to discover your
						personalized path to cutting food costs and eliminating waste
					</p>
					<Button
						variant="primary"
						size="lg"
						className="hero__cta"
					>
						Discover My Inventory Score
					</Button>
				</div>

				<div className="hero__image">
					<div className="hero__dashboard-placeholder">
						Dashboard Screenshot
					</div>
				</div>
			</div>
		</section>
	);
}

// ===== VALUE PROPOSITION SECTION =====
function ValueProposition() {
	return (
		<section className="value-proposition">
			<div className="value-proposition__content">
				<header className="value-proposition__header">
					<h2 className="value-proposition__headline">
						What You'll Discover in 3 Minutes
					</h2>
					<p className="value-proposition__subheadline">
						Answer 15 questions to unlock your personalized roadmap for:
					</p>
				</header>

				<div className="value-proposition__grid">
					{valueProps.map((prop) => (
						<ValuePropCard
							key={prop.id}
							icon={prop.icon}
							title={prop.title}
							bullets={prop.bullets}
						/>
					))}
				</div>

				<p className="value-proposition__support">
					Join the founding cohort of operators transforming inventory from
					headache to advantage
				</p>
			</div>
		</section>
	);
}

// ===== CREDENTIALS SECTION =====
function Credentials() {
	return (
		<section className="credentials">
			<div className="credentials__content">
				<header className="credentials__header">
					<h2 className="credentials__headline">{credentials.headline}</h2>

					<div className="credentials__intro-section">
						<p className="credentials__body-copy">{credentials.bodyCopy}</p>
					</div>
				</header>

				<div className="credentials__grid">
					<article className="credentials__card">
						<div className="credentials__card-icon">
							<AlertTriangle size={28} />
						</div>
						<h3 className="credentials__card-title">The Real Problem</h3>
						<p className="credentials__card-body">{credentials.problem}</p>
					</article>

					<article className="credentials__card">
						<div className="credentials__card-icon">
							<Zap size={28} />
						</div>
						<h3 className="credentials__card-title">
							What Makes This Different
						</h3>
						<ul className="credentials__card-list">
							{credentials.difference.map((item, index) => (
								<li
									key={index}
									className="credentials__card-item"
								>
									{item}
								</li>
							))}
						</ul>
					</article>

					<article className="credentials__card">
						<div className="credentials__card-icon">
							<Target size={28} />
						</div>
						<h3 className="credentials__card-title">Our Mission</h3>
						<p className="credentials__card-body">{credentials.mission}</p>
					</article>
				</div>
			</div>
		</section>
	);
}

// ===== CTA SECTION =====
function CTASection() {
	return (
		<section className="cta-section">
			<div className="cta-section__content">
				<div className="cta-section__inner">
					<h2 className="cta-section__headline">{callToAction.headline}</h2>

					<Button
						variant="secondary"
						size="lg"
						className="cta-section__button"
					>
						{callToAction.buttonText}
					</Button>

					<ul className="cta-section__reasons">
						{callToAction.reasons.map((reason, index) => {
							const Icon = reason.icon;
							return (
								<li
									key={index}
									className="cta-section__reason"
								>
									<div className="cta-section__reason-header">
										<Icon
											size={20}
											className="cta-section__reason-icon"
										/>
										<span className="cta-section__reason-heading">
											{reason.heading}
										</span>
									</div>
									<p className="cta-section__reason-body">{reason.body}</p>
								</li>
							);
						})}
					</ul>

					<p className="cta-section__trust">{callToAction.closing}</p>
				</div>
			</div>
		</section>
	);
}

// ===== MAIN APP =====
export default function LandingPage() {
	return (
		<div className="landing">
			<style>{`
        /* Reset & Base */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          line-height: 1.5;
          color: #1a1a1a;
        }

        /* Design Tokens */
        :root {
          --color-primary: hsl(148, 38%, 28%);
          --color-primary-dark: hsl(148, 38%, 18%);
          --color-secondary: hsl(45, 67%, 52%);
          --color-secondary-dark: hsl(45, 67%, 42%);
          
          --color-neutral-50: hsl(0, 0%, 98%);
          --color-neutral-200: hsl(0, 0%, 90%);
          --color-neutral-300: hsl(0, 0%, 80%);
          --color-neutral-600: hsl(0, 0%, 35%);
          --color-neutral-900: hsl(0, 0%, 8%);
          
          --color-text-primary: var(--color-neutral-900);
          --color-text-secondary: var(--color-neutral-600);
          --color-text-inverse: var(--color-neutral-50);
          
          --space-2: 0.5rem;
          --space-3: 0.75rem;
          --space-4: 1rem;
          --space-6: 1.5rem;
          --space-8: 2rem;
          --space-12: 3rem;
          --space-20: 5rem;
          
          --font-size-base: 1rem;
          --font-size-lg: 1.125rem;
          --font-size-xl: 1.25rem;
          --font-size-2xl: 1.5rem;
          --font-size-3xl: 1.875rem;
          --font-size-4xl: 2.25rem;
          --font-size-5xl: 3rem;
          
          --font-weight-medium: 500;
          --font-weight-semibold: 600;
          --font-weight-bold: 700;
          
          --border-radius-base: 8px;
          --border-radius-lg: 12px;
          --border-radius-full: 9999px;
          
          --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
          
          --layout-content-max: 1180px;
        }

        .landing {
          min-height: 100vh;
          background-color: white;
        }

        /* Button Styles */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem;
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          border: 2px solid transparent;
          border-radius: var(--border-radius-base);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn--primary {
          background-color: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .btn--primary:hover {
          background-color: var(--color-primary-dark);
          border-color: var(--color-primary-dark);
        }

        .btn--secondary {
          background-color: var(--color-secondary);
          color: var(--color-neutral-900);
          border-color: var(--color-secondary);
        }

        .btn--secondary:hover {
          background-color: var(--color-secondary-dark);
          border-color: var(--color-secondary-dark);
        }

        .btn--lg {
          padding: 1rem 2rem;
          font-size: var(--font-size-lg);
        }

        /* Hero Section */
        .hero {
          position: relative;
          min-height: 600px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero__background {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #2d5f3f 0%, #1a3824 100%);
        }

        .hero__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(45, 95, 63, 0.9) 0%, rgba(26, 56, 36, 0.8) 100%);
        }

        .hero__content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: var(--layout-content-max);
          margin: 0 auto;
          padding: var(--space-20) var(--space-6);
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: var(--space-12);
          align-items: center;
        }

        .hero__text {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          color: white;
        }

        .hero__headline {
          font-size: var(--font-size-5xl);
          font-weight: var(--font-weight-bold);
          line-height: 1.2;
        }

        .hero__subheadline {
          font-size: var(--font-size-xl);
          line-height: 1.75;
          opacity: 0.95;
        }

        .hero__image {
          justify-self: end;
          width: 100%;
          max-width: 700px;
        }

        .hero__dashboard-placeholder {
          width: 100%;
          aspect-ratio: 16/9;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
          border-radius: var(--border-radius-lg);
          border: 2px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.6);
          font-size: var(--font-size-2xl);
          box-shadow: var(--shadow-2xl);
        }

        /* Value Proposition */
        .value-proposition {
          background-color: var(--color-neutral-50);
          padding: var(--space-20) var(--space-6);
        }

        .value-proposition__content {
          max-width: var(--layout-content-max);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-12);
        }

        .value-proposition__header {
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }

        .value-proposition__headline {
          font-size: var(--font-size-4xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-4);
        }

        .value-proposition__subheadline {
          font-size: var(--font-size-xl);
          color: var(--color-text-secondary);
        }

        .value-proposition__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-8);
        }

        .value-proposition__support {
          text-align: center;
          font-size: var(--font-size-lg);
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
        }

        /* Value Card */
        .value-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          padding: var(--space-8);
          background: rgba(45, 95, 63, 0.03);
          border: 2px solid var(--color-neutral-300);
          border-radius: var(--border-radius-lg);
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .value-card:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-lg);
          transform: translateY(-4px);
        }

        .value-card__glow {
          position: absolute;
          inset: -2px;
          z-index: -1;
          background: linear-gradient(45deg, transparent 30%, rgba(45, 95, 63, 0.15) 50%, transparent 70%);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .value-card:hover .value-card__glow {
          opacity: 1;
        }

        .value-card__header {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .value-card__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, var(--color-primary) 0%, rgba(45, 95, 63, 0.8) 100%);
          color: white;
          border-radius: var(--border-radius-base);
          box-shadow: var(--shadow-md);
        }

        .value-card__title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          line-height: 1.3;
          flex: 1;
        }

        .value-card__list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          list-style: none;
        }

        .value-card__item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .value-card__check {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          background-color: var(--color-primary);
          color: white;
          border-radius: var(--border-radius-full);
        }

        .value-card__text {
          font-size: var(--font-size-base);
          color: var(--color-text-secondary);
          line-height: 1.75;
          padding-top: 2px;
        }

        /* Credentials */
        .credentials {
          background-color: white;
          padding: var(--space-20) var(--space-6);
        }

        .credentials__content {
          max-width: var(--layout-content-max);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-12);
        }

        .credentials__header {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }

        .credentials__headline {
          font-size: var(--font-size-4xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .credentials__body-copy {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-medium);
          font-style: italic;
          color: var(--color-text-secondary);
          line-height: 1.75;
          padding: var(--space-6);
          background: linear-gradient(135deg, rgba(45, 95, 63, 0.05) 0%, rgba(45, 95, 63, 0.02) 100%);
          border-left: 4px solid var(--color-primary);
          border-radius: var(--border-radius-base);
        }

        .credentials__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-8);
        }

        .credentials__card {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          padding: var(--space-8);
          background-color: var(--color-neutral-50);
          border: 2px solid var(--color-neutral-200);
          border-radius: var(--border-radius-lg);
          transition: all 0.2s ease;
        }

        .credentials__card:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .credentials__card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, rgba(45, 95, 63, 0.1) 0%, rgba(45, 95, 63, 0.05) 100%);
          color: var(--color-primary);
          border-radius: var(--border-radius-base);
        }

        .credentials__card-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .credentials__card-body {
          font-size: var(--font-size-base);
          color: var(--color-text-secondary);
          line-height: 1.75;
        }

        .credentials__card-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          list-style: none;
        }

        .credentials__card-item {
          position: relative;
          padding-left: var(--space-6);
          font-size: var(--font-size-base);
          color: var(--color-text-secondary);
          line-height: 1.75;
        }

        .credentials__card-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.6em;
          width: 6px;
          height: 6px;
          background-color: var(--color-primary);
          border-radius: var(--border-radius-full);
        }

        /* CTA Section */
        .cta-section {
          background: linear-gradient(135deg, var(--color-primary) 0%, rgba(45, 95, 63, 0.9) 100%);
          color: white;
          padding: var(--space-20) var(--space-6);
        }

        .cta-section__content {
          max-width: var(--layout-content-max);
          margin: 0 auto;
        }

        .cta-section__inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-8);
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
        }

        .cta-section__headline {
          font-size: var(--font-size-4xl);
          font-weight: var(--font-weight-bold);
          line-height: 1.2;
        }

        .cta-section__button {
          min-width: 280px;
        }

        .cta-section__reasons {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          list-style: none;
          width: 100%;
        }

        .cta-section__reason {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          text-align: left;
          padding: var(--space-4);
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--border-radius-base);
          border-left: 3px solid var(--color-secondary);
        }

        .cta-section__reason-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .cta-section__reason-icon {
          color: var(--color-secondary);
          flex-shrink: 0;
        }

        .cta-section__reason-heading {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
        }

        .cta-section__reason-body {
          font-size: var(--font-size-base);
          line-height: 1.75;
          opacity: 0.9;
          padding-left: calc(20px + var(--space-3));
        }

        .cta-section__trust {
          font-size: 0.875rem;
          opacity: 0.9;
          margin-top: var(--space-4);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .hero__content {
            grid-template-columns: 1fr;
          }

          .hero__image {
            justify-self: center;
            max-width: 100%;
          }

          .credentials__grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .hero__headline {
            font-size: var(--font-size-4xl);
          }

          .value-proposition__headline,
          .credentials__headline,
          .cta-section__headline {
            font-size: var(--font-size-3xl);
          }

          .value-proposition__grid {
            grid-template-columns: 1fr;
          }

          .cta-section__button {
            width: 100%;
            min-width: auto;
          }

          .cta-section__reason-body {
            padding-left: 0;
          }
        }
      `}</style>

			<Hero />
			<ValueProposition />
			<Credentials />
			<CTASection />
		</div>
	);
}
