const apiKey = "6c4e0912b8154924f395d5afbcf59fb5";
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

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    cityName
  )}&appid=${apiKey}&units=metric&lang=ru`;

  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      displayWeather(data);
    } else {
      throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Ошибка:", error);
    weatherDisplay.innerText = `Ошибка: ${error.message}`;
  }
}

function displayWeather(weatherData) {
  const temperature = weatherData.main.temp;
  const description = weatherData.weather[0].description;

  weatherDisplay.innerHTML = `
    <div>
      <h2>Погода в ${weatherData.name}</h2>
      <div class="temp-box"> 
        <p>Температура: ${temperature}°C</p>
      </div>
      <p>Описание: ${description}</p>
    </div>
  `;
}

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

weatherButton.addEventListener("click", getWeather);

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
