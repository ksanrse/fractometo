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
    console.error(error);
    weatherDisplay.innerText = error.message;
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

function updateFractal(temperature, humidity, windSpeed, pressure) {
  const fractalBox = document.getElementById("fractalBox");

  const fractalBoxSize = fractalBox.getBoundingClientRect();
  const fractalWidth = fractalBoxSize.width;
  const fractalHeight = fractalBoxSize.height;

  new p5((p) => {
    let angle = 0;
    let fractalSize = 15;
    let lineDensity = 100;
    let speedFactor = 0.003;
    let fractalForm = 1;
    let breathingOffset = 0;
    let breathingSpeed = 0.01;
    const maxBreathingOffset = Math.min(fractalWidth, fractalHeight) / 4; 

    p.setup = () => {
      p.createCanvas(fractalWidth, fractalHeight).parent(fractalBox);
      p.frameRate(165);
    };

    p.temperatureToColor = (temp) => {
      const minTemp = -90;
      const maxTemp = 57;
      const scale = (temp - minTemp) / (maxTemp - minTemp);
      const clampedScale = Math.min(Math.max(scale, 0), 1);
      const red = Math.floor(clampedScale * 255);
      const blue = Math.floor((1 - clampedScale) * 255);
      return p.color(red, 0, blue);
    };

    p.humidityToLineDensity = (humidity) => {
      return Math.floor((humidity / 100) * 500);
    };

    p.drawFractal = (x, y, size, angle, density, form) => {
      p.push();
      p.translate(x, y);
      p.rotate(angle);
      p.beginShape();

      for (let i = 0; i < density; i++) {
        const rad = p.radians(i * form);
        const r =
          size *
          (1 +
            0.7 * p.sin(8 * rad + temperature / 5) +
            0.4 * p.cos(5 * rad + humidity / 50) +
            0.6 * p.sin(7 * rad + pressure / 300) +
            0.3 * p.cos(3 * rad + windSpeed / 5) +
            p.random(-0.3, 0.3));

        const x1 = r * p.cos(rad);
        const y1 = r * p.sin(rad);
        p.vertex(x1, y1);
      }

      p.endShape(p.CLOSE);
      p.pop();
    };

    p.draw = () => {
      p.clear();
      const fractalColor = p.temperatureToColor(temperature);
      p.stroke(fractalColor);
      p.noFill();

      breathingOffset = Math.sin(p.frameCount * breathingSpeed) * maxBreathingOffset - 50;

      lineDensity = p.humidityToLineDensity(humidity);
      angle += windSpeed * speedFactor;

      fractalForm =
        1 +
        pressure / 1000 +
        humidity / 200 +
        temperature / 50 +
        p.random(0, 0.5);

      p.drawFractal(
        fractalWidth / 2,
        fractalHeight / 2,
        fractalSize + breathingOffset,
        angle,
        lineDensity,
        fractalForm
      );
    };
  });
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
    <div class="weather-box" id="weatherBox">
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

  updateFractal(temperature, humidity, windSpeed, pressure);
}

weatherButton.addEventListener("click", getWeather);

cityInput.addEventListener("input", showCitySuggestions);
cityInput.addEventListener("focus", showCitySuggestions);

function showCitySuggestions() {
  const inputValue = cityInput.value.toLowerCase();

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().startsWith(inputValue)
  );

  displaySuggestions(filteredCities.slice(0, 5));
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

let currentIndex = -1;

function showCitySuggestions() {
  const inputValue = cityInput.value.toLowerCase();

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().startsWith(inputValue)
  );

  displaySuggestions(filteredCities.slice(0, 5));
}

function displaySuggestions(suggestions) {
  suggestionsBox.innerHTML = "";
  currentIndex = -1;

  suggestions.forEach((city, index) => {
    const suggestionItem = document.createElement("li");
    suggestionItem.textContent = city.name;
    suggestionItem.addEventListener("click", () => {
      selectCity(city.name);
    });
    suggestionsBox.appendChild(suggestionItem);
  });

  suggestionsBox.style.display = suggestions.length > 0 ? "block" : "none";
}

function selectCity(cityName) {
  cityInput.value = cityName;
  suggestionsBox.style.display = "none";
}

cityInput.addEventListener("keydown", (event) => {
  const suggestions = suggestionsBox.querySelectorAll("li");

  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (currentIndex < suggestions.length - 1) {
      currentIndex++;
      highlightSuggestion(suggestions, currentIndex);
    }
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    if (currentIndex > 0) {
      currentIndex--;
      highlightSuggestion(suggestions, currentIndex);
    }
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (currentIndex >= 0 && suggestions[currentIndex]) {
      selectCity(suggestions[currentIndex].textContent);
    } else {
      getWeather();
    }
  }
});

function highlightSuggestion(suggestions, index) {
  suggestions.forEach((item) => {
    item.style.backgroundColor = "transparent";
    item.style.color = "#fff";
  });

  suggestions[index].style.backgroundColor = "#4c47eb";
  suggestions[index].style.color = "#fff";
}

document.addEventListener("click", (event) => {
  if (
    !cityInput.contains(event.target) &&
    !suggestionsBox.contains(event.target)
  ) {
    suggestionsBox.style.display = "none";
  }
});

cityInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    const cityName = cityInput.value.trim();
    if (cityName === "") {
      return;
    } else {
      getWeather(cityName);
    }
  }
});
