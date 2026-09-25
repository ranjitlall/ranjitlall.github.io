// A fresh identifier on every build, appended to the stylesheet's URL
// (style.css?v=...). Browsers keep a saved copy of the stylesheet; a new URL
// after each deploy makes them fetch the new one instead of showing a page
// with out-of-date styles.
export default {
  id: Date.now().toString(36),
};
