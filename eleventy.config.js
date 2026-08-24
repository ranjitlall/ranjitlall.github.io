export default function (eleventyConfig) {
  // The assets folder lives at the repository root, not inside src/, so that the
  // existing assets/pdf/ and assets/img/ files keep their current URLs. Eleventy
  // copies it through unchanged to _site/assets.
  eleventyConfig.addPassthroughCopy("assets");

  // --- Filters -----------------------------------------------------------

  eleventyConfig.addFilter("limit", (array, n) => array.slice(0, n));

  // Group publications by year, newest first.
  eleventyConfig.addFilter("byYear", (items) => {
    const years = [...new Set(items.map((i) => i.year))].sort((a, b) => b - a);
    return years.map((year) => ({
      year,
      items: items.filter((i) => i.year === year),
    }));
  });

  return {
    // This is a USER site served from the domain root (ranjitlall.github.io).
    // It must stay "/". The CTS site is a PROJECT site and uses "/cts-website/";
    // copying that setting here would break every link and image.
    pathPrefix: "/",

    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
