import variables from '@/assets/styles/variables.module.less';

type Mod = string | { [key: string]: any };
type Mods = Mod | Mod[];

export function useDesign(scope?: string) {
  let prefixCls: string = variables.name;
  if (scope) prefixCls += '-' + scope;

  const bem = bemFactory(prefixCls);

  return {
    variables,
    prefixCls,
    bem,
  };
}

/**
 * bem helper
 * @example
 * b() // 'button'
 * b('text') // 'button__text'
 * b({ disabled }) // 'button button--disabled'
 * b('text', { disabled }) // 'button__text button__text--disabled'
 * b(['disabled', 'primary']) // 'button button--disabled button--primary'
 */
export function bemFactory(prefix: string) {
  return (el?: Mods, mods?: Mods): string => {
    if (el && typeof el !== 'string') {
      mods = el;
      el = '';
    }

    el = el ? `${prefix}__${el}` : prefix;

    return `${el}${_bemStr(el, mods)}`;
  };
}

function _bemStr(name: string, mods?: Mods): string {
  if (!mods) return '';

  if (typeof mods === 'string') return ` ${name}--${mods}`;

  if (Array.isArray(mods)) {
    return mods.reduce((ret, item) => ret + _bemStr(name, item), '');
  }

  return Object.keys(mods).reduce((ret, key) => ret + (mods[key] ? _bemStr(name, key) : ''), '');
}