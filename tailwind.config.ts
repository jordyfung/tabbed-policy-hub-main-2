import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        coral: {
          DEFAULT: "hsl(var(--coral))",
          foreground: "hsl(var(--coral-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        critical: {
          DEFAULT: "hsl(var(--critical))",
          foreground: "hsl(var(--critical-foreground))",
        },
        governance: {
          DEFAULT: "hsl(var(--governance))",
        },
        clinical: {
          DEFAULT: "hsl(var(--clinical))",
        },
        personal: {
          DEFAULT: "hsl(var(--personal))",
        },
        environment: {
          DEFAULT: "hsl(var(--environment))",
        },
        nutrition: {
          DEFAULT: "hsl(var(--nutrition))",
        },
        medication: {
          DEFAULT: "hsl(var(--medication))",
        },
        incidents: {
          DEFAULT: "hsl(var(--incidents))",
        },
        workforce: {
          DEFAULT: "hsl(var(--workforce))",
        },
        "standard-1-person": {
          DEFAULT: "hsl(var(--standard-1-person))",
        },
        "standard-2-organisation": {
          DEFAULT: "hsl(var(--standard-2-organisation))",
        },
        "standard-3-care": {
          DEFAULT: "hsl(var(--standard-3-care))",
        },
        "standard-4-environment": {
          DEFAULT: "hsl(var(--standard-4-environment))",
        },
        "standard-5-clinical": {
          DEFAULT: "hsl(var(--standard-5-clinical))",
        },
        "standard-6-nutrition": {
          DEFAULT: "hsl(var(--standard-6-nutrition))",
        },
        "standard-7-community": {
          DEFAULT: "hsl(var(--standard-7-community))",
        },
        nav: {
          background: "hsl(var(--nav-background))",
          border: "hsl(var(--nav-border))",
        },
        tab: {
          active: "hsl(var(--tab-active))",
          hover: "hsl(var(--tab-hover))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
