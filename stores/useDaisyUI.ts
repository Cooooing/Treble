import { defineStore } from 'pinia'

export const useDaisyUI = defineStore('daisyUI', {
  state: () => ({
    theme: localStorage.getItem('theme') || 'fishpi',
  }),
  getters: {
    currentTheme: (state) => state.theme,
    themes() {
      return [
        'fishpi',
        'dark', //
        'emerald', 
        'cyberpunk',
        'valentine',
        'halloween',//
        'forest', //
        'dracula', //
        'business', //
        'lemonade', 
        'night', //
        'coffee', //
        'winter', 
      ]
    },
    darkThemes(): string[] {
      return [
        'dark',
        'halloween',
        'forest',
        'dracula',
        'business',
        'night',
        'coffee',
      ]
    },
    isDarkTheme(): boolean {
      return this.darkThemes.includes(this.theme)
    }
  },
  actions: {
    setTheme(theme: string) {
      this.theme = theme
      localStorage.setItem('theme', theme)
      if (this.darkThemes.includes(theme)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
  },
})