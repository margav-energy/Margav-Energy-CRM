/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "margav-green": "#66cc66",
        "margav-green-light": "#33cc66",
        "margav-teal": "#00cc99",
        "margav-blue": "#3333cc",
      },
      backgroundImage: {
        "margav-gradient":
          "linear-gradient(135deg, #66cc66 0%, #33cc66 50%, #00cc99 100%)",
        "margav-dark": "linear-gradient(135deg, #3333cc 0%, #000000 100%)",
      },
    },
  },
  plugins: [],
};
