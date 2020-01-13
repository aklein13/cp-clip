onmessage = function (e) {
  const lowerCaseSearch = e.data.search.toLowerCase();
  const foundItems = [];
  e.data.history.forEach((item) => {
    if (item.value.toLowerCase().includes(lowerCaseSearch)) {
      foundItems.push(item);
      if (foundItems.length < 13) {
        postMessage(foundItems);
      }
    }
  });
  postMessage(foundItems);
};
