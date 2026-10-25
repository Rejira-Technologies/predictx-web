/**
 * UI string translations for PredictX.
 *
 * There is no locale switcher yet, so `t` always resolves against
 * DEFAULT_LOCALE unless a locale is passed explicitly. Monetary amounts are
 * always USD (see lib/constants.ts); do not derive a currency from the locale
 * without converting the amount at an explicit rate.
 */

export type SupportedLocale = "en" | "es" | "fr" | "de" | "pt";

export const DEFAULT_LOCALE: SupportedLocale = "en";

export const translations: Record<SupportedLocale, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.dashboard": "Dashboard",
    "nav.voting": "Voting",
    "nav.howItWorks": "How It Works",
    "wallet.connect": "Connect Wallet",
    "wallet.connected": "Connected",
    "wallet.disconnect": "Disconnect",
    "market.live": "LIVE",
    "market.upcoming": "UPCOMING",
    "market.resolved": "RESOLVED",
    "market.stake": "Stake",
    "market.pool": "Pool",
    "market.yes": "Yes",
    "market.no": "No",
  },
  es: {
    "nav.home": "Inicio",
    "nav.dashboard": "Panel",
    "nav.voting": "Votación",
    "nav.howItWorks": "Cómo Funciona",
    "wallet.connect": "Conectar Billetera",
    "wallet.connected": "Conectado",
    "wallet.disconnect": "Desconectar",
    "market.live": "EN VIVO",
    "market.upcoming": "PRÓXIMO",
    "market.resolved": "RESUELTO",
    "market.stake": "Apostar",
    "market.pool": "Fondo",
    "market.yes": "Sí",
    "market.no": "No",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.dashboard": "Tableau de Bord",
    "nav.voting": "Vote",
    "nav.howItWorks": "Comment ça Marche",
    "wallet.connect": "Connecter Portefeuille",
    "wallet.connected": "Connecté",
    "wallet.disconnect": "Déconnecter",
    "market.live": "EN DIRECT",
    "market.upcoming": "À VENIR",
    "market.resolved": "RÉSOLU",
    "market.stake": "Miser",
    "market.pool": "Poule",
    "market.yes": "Oui",
    "market.no": "Non",
  },
  de: {
    "nav.home": "Startseite",
    "nav.dashboard": "Dashboard",
    "nav.voting": "Abstimmung",
    "nav.howItWorks": "Wie es Funktioniert",
    "wallet.connect": "Wallet Verbinden",
    "wallet.connected": "Verbunden",
    "wallet.disconnect": "Trennen",
    "market.live": "LIVE",
    "market.upcoming": "BEVORSTEHEND",
    "market.resolved": "GELÖST",
    "market.stake": "Einsatz",
    "market.pool": "Pool",
    "market.yes": "Ja",
    "market.no": "Nein",
  },
  pt: {
    "nav.home": "Início",
    "nav.dashboard": "Painel",
    "nav.voting": "Votação",
    "nav.howItWorks": "Como Funciona",
    "wallet.connect": "Conectar Carteira",
    "wallet.connected": "Conectado",
    "wallet.disconnect": "Desconectar",
    "market.live": "AO VIVO",
    "market.upcoming": "PRÓXIMO",
    "market.resolved": "RESOLVIDO",
    "market.stake": "Apostar",
    "market.pool": "Pool",
    "market.yes": "Sim",
    "market.no": "Não",
  },
};

export function t(key: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
  return translations[locale]?.[key] ?? translations[DEFAULT_LOCALE]?.[key] ?? key;
}
