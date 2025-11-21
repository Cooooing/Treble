import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useDaisyui() {
  const isSystemDark = ref(false)
  const isDaisyDark = ref(false)
  const userChosenTheme = ref<string | null>(null) // null = 没有显式选择

  // 读取 localStorage（daisyUI / 你的实现可能用不同的 key，例如 'theme'）
  function readUserChoice() {
    try {
      userChosenTheme.value = localStorage.getItem('theme') // adjust key if you use other key
    } catch (e) {
      userChosenTheme.value = null
    }
  }

  function updateDaisyState() {
    const el = document.documentElement
    const dataTheme = el?.getAttribute('data-theme')
    const hasDarkClass = el?.classList?.contains('dark')
    // 这里把 data-theme==='dark' 或有 .dark 视为深色主题，根据你的实际 theme 名称调整
    isDaisyDark.value = (dataTheme === 'dark') || !!hasDarkClass
  }

  let mql: MediaQueryList | null = null
  function onPrefersChange(e: MediaQueryListEvent) {
    isSystemDark.value = e.matches
    // 如果你想在系统偏好变更时同步更新 daisy 状态（如果 daisy 使用 media），也可以调用：
    updateDaisyState()
  }

  onMounted(() => {
    readUserChoice()
    updateDaisyState()

    if (typeof window !== 'undefined' && window.matchMedia) {
      mql = window.matchMedia('(prefers-color-scheme: dark)')
      isSystemDark.value = mql.matches
      // 兼容 addEventListener / addListener
      if (mql.addEventListener) mql.addEventListener('change', onPrefersChange)
      else if (mql.addListener) mql.addListener(onPrefersChange)
    }
    // 如果你的应用在运行时通过 JS 切换 data-theme，建议在切换处也调用 readUserChoice/updateDaisyState
  })

  onUnmounted(() => {
    if (!mql) return
    mql.removeEventListener('change', onPrefersChange)
  })

  // 计算：当前是否“由 prefers-color-scheme 驱动且显示为深色”
  const isUsingPrefersDark = computed(() => {
    // 如果用户有显式选择（localStorage 有值），我们认为不是被 prefers 驱动
    if (userChosenTheme.value) return false
    // 否则，如果系统偏好为深色且当前 daisy 为深色，就可以认为当前是 prefers-dark 驱动的
    return isSystemDark.value && isDaisyDark.value
  })

  return {
    isSystemDark,
    isDaisyDark,
    userChosenTheme,
    isUsingPrefersDark
  }
}