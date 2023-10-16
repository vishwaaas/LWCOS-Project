/**
 * This file exists in order to get around circular dependencies.
 * For ex. the `columns.js` file has a dependency on `sort.js`,
 * which also has a dependency on `columns.js` for `getColumnName()`.
 *
 * We split out some of the functions that could cause circular dependencies with
 * `column.js` into the `*-shared.js` files. `inlineEditShared.js` is another.
 */

export function getColumnName(column) {
  return column.columnKey || column.fieldName;
}