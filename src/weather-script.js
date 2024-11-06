const apiKey = CONFIG.API_KEY;
const CACHE_EXPIRATION_TIME = 30 * 60 * 1000;

const weatherButton = document.getElementById("weatherButton");
const cityInput = document.getElementById("cityInput");
const weatherDisplay = document.getElementById("weatherDisplay");
const suggestionsBox = document.getElementById("suggestionsBox");

fetch("./cities.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.statusText}`);
    }
    return response.json();
  })
  .then((data) => {
    if (data.city && Array.isArray(data.city)) {
      cities = data.city;
    } else {
      throw new Error(
        "Ошибка: cities.json должен содержать массив под ключом 'city'."
      );
    }
  })
  .catch((error) => console.error("Ошибка загрузки списка городов:", error));

async function getWeather() {
  const cityName = cityInput.value.trim();
  if (cityName === "") {
    alert("Введите имя города");
    return;
  }

  const cachedData = getCachedWeather(cityName);
  if (cachedData) {
    displayWeather(cachedData);
    return;
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    cityName
  )}&appid=${apiKey}&units=metric&lang=ru`;

  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      displayWeather(data);
      cacheWeather(cityName, data);
    } else {
      throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Ошибка:", error);
    weatherDisplay.innerText = `Ошибка: ${error.message}`;
  }
}

function getCachedWeather(cityName) {
  const cachedItem = localStorage.getItem(`weather_${cityName}`);
  if (!cachedItem) return null;

  const cachedData = JSON.parse(cachedItem);
  const currentTime = new Date().getTime();

  if (currentTime - cachedData.timestamp < CACHE_EXPIRATION_TIME) {
    return cachedData.data;
  } else {
    localStorage.removeItem(`weather_${cityName}`);
    return null;
  }
}

function cacheWeather(cityName, data) {
  const cacheItem = {
    data: data,
    timestamp: new Date().getTime(),
  };
  localStorage.setItem(`weather_${cityName}`, JSON.stringify(cacheItem));
}

function displayWeather(weatherData) {
  const temperature = weatherData.main.temp;
  const description = weatherData.weather[0].description;
  const minTemp = weatherData.main.temp_min;
  const maxTemp = weatherData.main.temp_max;
  const feelsLike = weatherData.main.feels_like;
  const humidity = weatherData.main.humidity;
  const pressure = weatherData.main.pressure;
  const windSpeed = weatherData.wind.speed;
  const rain = weatherData.rain ? weatherData.rain["1h"] : 0;

  weatherDisplay.innerHTML = `
    <div class="weather-box fractalBox" id="fractalBox"></div>
    <div class="weather-box">
      <p class="weather-box-big">Сегодня</p>
      <p>${minTemp}°C...${maxTemp}°C — ${description}, осадки ${rain}мм — ветер ${windSpeed} м/с</p>
    </div>
    <div class="weather-box">
      <p>Температура сейчас <p class="weather-box-big">${temperature}°C</p></p>
    </div>
    <div class="weather-box">
      <p>Температура ощущается как <p class="weather-box-big">${feelsLike}°C</p></p>
    </div>
    <div class="weather-box">
      <p>Скорость ветра <p class="weather-box-big">${windSpeed} м/с</p></p>
    </div>
    <div class="weather-box">
      <p>Влажность <p class="weather-box-big">${humidity}%</p></p>
    </div>
    <div class="weather-box">
      <p>Давление <p class="weather-box-big">${pressure} гПа</p></p>
    </div>
  `;
}

weatherButton.addEventListener("click", getWeather);

cityInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    getWeather();
  }
});

cityInput.addEventListener("input", showCitySuggestions);
cityInput.addEventListener("focus", showCitySuggestions);

function showCitySuggestions() {
  const inputValue = cityInput.value.toLowerCase();

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().startsWith(inputValue)
  );

  displaySuggestions(filteredCities.slice(0, 10));
}

function displaySuggestions(suggestions) {
  suggestionsBox.innerHTML = "";

  suggestions.forEach((city) => {
    const suggestionItem = document.createElement("li");
    suggestionItem.textContent = city.name;
    suggestionItem.addEventListener("click", () => {
      cityInput.value = city.name;
      suggestionsBox.innerHTML = "";
      suggestionsBox.style.display = "none";
    });
    suggestionsBox.appendChild(suggestionItem);
  });

  suggestionsBox.style.display = suggestions.length > 0 ? "block" : "none";
}

cityInput.addEventListener("input", () => {
  if (cityInput.value.trim() === "") {
    suggestionsBox.style.display = "none";
  }
});

document.addEventListener("click", (event) => {
  if (
    !cityInput.contains(event.target) &&
    !suggestionsBox.contains(event.target)
  ) {
    suggestionsBox.style.display = "none";
  }
});
