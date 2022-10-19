$(document).ready(function () {
  // Global Constants
  const apiKey = "3a9ec11d25dfef4ddd17214483eecf37";
  const cityCon = $("h2#city");
  const dateCon = $("h3#date");
  const tempCon = $("span#temperature");
  const humidCon = $("span#humidity");
  const windCon = $("span#wind");
  const uvCon = $("span#uv-index");
  const cityListCon = $("div.search-history-list");
  const weatherIconCon = $("img#icon");
  const userSearch = $("#inputCity");

  // Creating Past City array with a blank value
  let pastCities = [];

  function compare(a, b) {
    const cityA = a.city.toUpperCase();
    const cityB = b.city.toUpperCase();

    let comparison = 0;
    if (cityA > cityB) {
      comparison = 1;
    } else if (cityA < cityB) {
      comparison = -1;
    }
    return comparison;
  }

  function grabCities() {
    const searchHistory = JSON.parse(localStorage.getItem("pastCities"));
    if (searchHistory) {
      pastCities = searchHistory;
    }
  }

  function storeCities() {
    localStorage.setItem("pastCities", JSON.stringify(pastCities));
  }

  function buildURLCity(city) {
    if (city) {
      return `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
    }
  }

  function buildURLId(id) {
    return `https://api.openweathermap.org/data/2.5/weather?id=${id}&appid=${apiKey}`;
  }

  function displayCities(pastCities) {
    cityListCon.empty();
    pastCities.splice(5);
    let sortedCities = [...pastCities];
    sortedCities.sort(compare);
    sortedCities.forEach(function (location) {
      let cityDiv = $("<div>").addClass("search-history-box");
      let cityBtn = $("<button>")
        .addClass("search-history-button btn btn-light btn-block")
        .text(location.city);
      cityDiv.append(cityBtn);
      cityListCon.append(cityDiv);
    });
  }

  // UV Index background color changing

  function uvIndexColor(uvi) {
    if (uvi < 3) {
      return "green";
    } else if (uvi >= 3 && uvi < 6) {
      return "yellow";
    } else if (uvi >= 6 && uvi < 8) {
      return "orange";
    } else if (uvi >= 8 && uvi < 11) {
      return "red";
    } else return "purple";
  }

  // Main function to call the current day forecast
  function callWeather(queryURL) {
    $.ajax({
      url: queryURL,
      method: "GET",
    }).then(function (response) {
      let city = response.name;
      let id = response.id;

      if (pastCities[0]) {
        pastCities = $.grep(pastCities, function (storedCity) {
          return id !== storedCity.id;
        });
      }
      pastCities.unshift({ city, id });
      storeCities();
      displayCities(pastCities);

      cityCon.text(response.name);
      let formatDate = moment.unix(response.dt).format("L");
      dateCon.text(formatDate);
      let weatherIcon = response.weather[0].icon;
      weatherIconCon
        .attr("src", `http://openweathermap.org/img/wn/${weatherIcon}.png`)
        .attr("alt", response.weather[0].description);
      // Temperature adjusted from Metric to Imperial 
      tempCon.html(((response.main.temp - 273.15) * 1.8 + 32).toFixed(1));
      humidCon.text(response.main.humidity);
      // WindSpeed adjusted from Metric to Imperial
      windCon.text((response.wind.speed * 2.237).toFixed(1));

      let lat = response.coord.lat;
      let lon = response.coord.lon;
      let queryURLMain = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=imperical&appid=${apiKey}`;
      $.ajax({
        url: queryURLMain,
        method: "GET",
      }).then(function (response) {
        let uvIndex = response.daily[0].uvi;
        let uvColor = uvIndexColor(uvIndex);
        uvCon.text(uvIndex);
        uvCon.attr(
          "style",
          `background-color: ${uvColor}; color: ${
            uvColor === "yellow" ? "black" : "white"
          }`
        );
        // Displays 5 day Forecast data for selected city
        let fiveDay = response.daily;
        console.log(response);
        // 5 day forecast
        for (let i = 0; i <= 5; i++) {
          let today = fiveDay[i + 1];
          // Appending the API Weather Information to the index.html document
          $(`div.day-${i} .day-date`).text(moment.unix(today.dt).format("L"));
          $(`div.day-${i} .icon`)
            .attr(
              "src",
              `http://openweathermap.org/img/wn/${today.weather[0].icon}.png`
            )
            .attr("alt", today.weather[0].description);
          $(`div.day-${i} .days-temp `).text(
            "Temperature: " +
              ((today.temp.day - 273.15) * 1.8 + 32).toFixed(1) +
              " °F"
          );
          $(`div.day-${i} .days-humid`).text(
            "Humidity: " + today.humidity + "%"
          );
          $(`div.day-${i} .days-windspeed `).text(
            "WindSpeed: " + (today.wind_speed * 2.237).toFixed(1) + " MPH"
          );
        }
      });
    });
  }

  // Search History Button information storage and display

  function displaySearchHistory() {
    if (pastCities[0]) {
      let queryURL = buildURLId(pastCities[0].id);
      callWeather(queryURL);
    } else {
      let queryURL = buildURLCity("City");
      callWeather(queryURL);
    }
  }

  $("#search-btn").on("click", function (event) {
    event.preventDefault();

    let city = userSearch.val().trim();
    city = city.replace(" ", "%20");

    userSearch.val("");

    if (city) {
      let queryURL = buildURLCity(city);
      callWeather(queryURL);
    }
  });

  $(document).on("click", "button.search-history-button", function (event) {
    let pickedCity = $(this).text();
    let oldCity = $.grep(pastCities, function (storedCity) {
      return pickedCity === storedCity.city;
    });
    let queryURL = buildURLId(oldCity[0].id);
    callWeather(queryURL);
  });

  grabCities();

  displayCities(pastCities);

  displaySearchHistory();
});
