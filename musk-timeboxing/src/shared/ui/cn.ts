export const cn = (...values: Array<string | false | null | undefined | Array<string | false | null | undefined>>) =>
  values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .join(' ')
