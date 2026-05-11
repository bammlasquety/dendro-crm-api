import { defineStore } from 'pinia'

export type CurrencyCode =
  | 'PHP'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'AUD'
  | 'SGD'

const STORAGE_KEY = 'dt_currency'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    currency: (localStorage.getItem(STORAGE_KEY) as CurrencyCode) || 'PHP',
  }),

  actions: {
    setCurrency(code: CurrencyCode) {
      this.currency = code
      localStorage.setItem(STORAGE_KEY, code)
    },

    formatMoney(value: number): string {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: this.currency,
      }).format(value)
    },
  },
})
