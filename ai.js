const wordPairs = [
    ["Beach", "Island"],
    ["Hospital", "Clinic"],
    ["School", "College"],
    ["Airport", "Railway Station"]
  ];
  
  function getWords(mode) {
    const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
  
    if (mode === "spy") {
      return {
        normal: pair[0],
        special: pair[1]
      };
    }
  
    // infiltrator mode
    return {
      normal: pair[0],
      special: null
    };
  }
  
  module.exports = { getWords };
  