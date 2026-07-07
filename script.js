const apiKey = "676389d6908210b591f55de44fda7063";
let fullForecastData = [];

// Initialize app
getWeather("Delhi");

async function getWeather(cityName) {
  const city = cityName || document.querySelector(".search").value;

  const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(weatherURL);
    const data = await response.json();

    if (data.cod != 200) {
      alert("City not found");
      return;
    }

    // Update current weather
    updateCurrentWeather(data);

    // Get forecast data
    const lat = data.coord.lat;
    const lon = data.coord.lon;

    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const forecastRes = await fetch(forecastURL);
    const forecastData = await forecastRes.json();

    // Store and display forecast
    display7DayForecast(forecastData);

  } catch (error) {
    console.error("Error fetching weather:", error);
    alert("Error fetching weather data");
  }
}

function updateCurrentWeather(data) {
  document.getElementById("temp").innerHTML = `${Math.round(data.main.temp)}°C`;
  document.getElementById("city").innerHTML = data.name;
  document.getElementById("humidity").innerHTML = `${data.main.humidity}%`;
  document.getElementById("wind").innerHTML = `${Math.round(data.wind.speed)} km/h`;
  document.getElementById("pressure").innerHTML = data.main.pressure;
  document.getElementById("visibility").innerHTML = `${(data.visibility / 1000).toFixed(1)} km`;
  document.getElementById("feels").innerHTML = `${Math.round(data.main.feels_like)}°C`;

  document.getElementById("details").innerHTML = `
    <p>🌧 ${data.weather[0].description}</p>
    <p>🌡 Min Temp - ${Math.round(data.main.temp_min)}°C</p>
    <p>🌡 Max Temp - ${Math.round(data.main.temp_max)}°C</p>
  `;

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  document.getElementById("day").innerHTML = days[today.getDay()];

  const iconCode = data.weather[0].icon;
  document.getElementById("icon").src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString();
  document.getElementById("sunrise").innerHTML = sunrise;
  document.getElementById("sunset").innerHTML = sunset;
}

function display7DayForecast(forecastData) {
  fullForecastData = forecastData.list;
  const forecastBox = document.getElementById("forecast");
  forecastBox.innerHTML = "";

  let temps = [];
  let labels = [];
  const processedDates = new Map();

  // Process 7 days of forecast
  for (let i = 0; i < fullForecastData.length && labels.length < 7; i++) {
    const item = fullForecastData[i];
    const date = new Date(item.dt_txt);
    const dateKey = date.toLocaleDateString("en-US"); // Use date as key
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Get one forecast per day (at noon time or closest to it)
    if (!processedDates.has(dateKey) && date.getHours() >= 10 && date.getHours() <= 14) {
      processedDates.set(dateKey, true);
      temps.push(item.main.temp);
      labels.push(dayName);

      forecastBox.innerHTML += `
        <div class="forecast-card" onclick="showDayDetails('${dayName}', '${dateStr}')">
          <h4>${dayName}<br><small>${dateStr}</small></h4>
          <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}">
          <p>${Math.round(item.main.temp)}°C</p>
          <small style="color: #aaa; font-size: 11px;">Click for details</small>
        </div>
      `;
    }
  }

  // If we couldn't get 7 full days, try alternative times
  if (labels.length < 7) {
    for (let i = 0; i < fullForecastData.length && labels.length < 7; i++) {
      const item = fullForecastData[i];
      const date = new Date(item.dt_txt);
      const dateKey = date.toLocaleDateString("en-US");
      
      if (!processedDates.has(dateKey)) {
        processedDates.set(dateKey, true);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        
        temps.push(item.main.temp);
        labels.push(dayName);

        forecastBox.innerHTML += `
          <div class="forecast-card" onclick="showDayDetails('${dayName}', '${dateStr}')">
            <h4>${dayName}<br><small>${dateStr}</small></h4>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}">
            <p>${Math.round(item.main.temp)}°C</p>
            <small style="color: #aaa; font-size: 11px;">Click for details</small>
          </div>
        `;
      }
    }
  }

  // Display temperature chart
  displayTemperatureChart(labels, temps);

  // Display tomorrow's weather
  displayTomorrowWeather(forecastData.list);
}

function displayTomorrowWeather(forecastList) {
  // Get tomorrow's data (first item in forecast list if it's tomorrow)
  if (forecastList.length > 0) {
    const tomorrowData = forecastList[8]; // ~24 hours from now (8 items * 3 hours each)
    if (tomorrowData) {
      document.getElementById("tomorrowTemp").innerHTML = `${Math.round(tomorrowData.main.temp)}°C`;
      document.getElementById("tomorrowDesc").innerHTML = tomorrowData.weather[0].description;
      document.getElementById("tomorrowIcon").src = `https://openweathermap.org/img/wn/${tomorrowData.weather[0].icon}@2x.png`;
    }
  }
}

function displayTemperatureChart(labels, temps) {
  const ctx = document.getElementById("chart");

  if (window.myChart) {
    window.myChart.destroy();
  }

  window.myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Temperature (°C)',
        data: temps,
        borderColor: '#4da6ff',
        backgroundColor: 'rgba(77, 166, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#4da6ff',
        pointBorderColor: '#1f2027',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: 'white',
            font: { size: 12 }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#aaa' },
          grid: { color: '#333' }
        },
        y: {
          ticks: { color: '#aaa' },
          grid: { color: '#333' }
        }
      }
    }
  });
}

function showDayDetails(dayName, dateStr) {
  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");
  document.getElementById("modalTitle").innerHTML = `${dayName} - ${dateStr}`;

  let dayDetailsHTML = '';

  // Group data by day
  const dayData = [];
  for (let item of fullForecastData) {
    const itemDate = new Date(item.dt_txt);
    const itemDay = itemDate.toLocaleDateString("en-US", { weekday: "short" });
    if (itemDay === dayName) {
      dayData.push(item);
    }
  }

  if (dayData.length === 0) {
    modalBody.innerHTML = '<p>No data available for this day</p>';
    modal.style.display = "block";
    return;
  }

  // Calculate min/max temps for the day
  let minTemp = Math.min(...dayData.map(d => d.main.temp_min));
  let maxTemp = Math.max(...dayData.map(d => d.main.temp_max));
  let avgTemp = (dayData.reduce((sum, d) => sum + d.main.temp, 0) / dayData.length).toFixed(1);
  let avgHumidity = (dayData.reduce((sum, d) => sum + d.main.humidity, 0) / dayData.length).toFixed(0);
  let avgWindSpeed = (dayData.reduce((sum, d) => sum + d.wind.speed, 0) / dayData.length).toFixed(2);
  let avgPressure = (dayData.reduce((sum, d) => sum + d.main.pressure, 0) / dayData.length).toFixed(0);

  dayDetailsHTML += `
    <div class="day-detail-card">
      <h3>📊 Daily Summary</h3>
      <p><strong>Average Temp:</strong> ${avgTemp}°C</p>
      <p><strong>Min Temp:</strong> ${Math.round(minTemp)}°C</p>
      <p><strong>Max Temp:</strong> ${Math.round(maxTemp)}°C</p>
      <p><strong>Humidity:</strong> ${avgHumidity}%</p>
      <p><strong>Wind Speed:</strong> ${avgWindSpeed} km/h</p>
      <p><strong>Pressure:</strong> ${avgPressure} hPa</p>
    </div>
  `;

  dayDetailsHTML += '<div class="day-detail-card"><h3>⏰ Hourly Forecast</h3></div>';

  // Show hourly data
  dayData.forEach((item, index) => {
    const time = new Date(item.dt_txt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
    dayDetailsHTML += `
      <div class="day-detail-card">
        <h3>🕐 ${time}</h3>
        <p><strong>Temperature:</strong> ${Math.round(item.main.temp)}°C (Feels like ${Math.round(item.main.feels_like)}°C)</p>
        <p><strong>Weather:</strong> ${item.weather[0].description}</p>
        <p><strong>Humidity:</strong> ${item.main.humidity}%</p>
        <p><strong>Wind Speed:</strong> ${item.wind.speed} km/h</p>
        <p><strong>Pressure:</strong> ${item.main.pressure} hPa</p>
        <p><strong>Visibility:</strong> ${(item.visibility / 1000).toFixed(1)} km</p>
        <p><strong>Rainfall Chance:</strong> ${(item.pop * 100).toFixed(0)}%</p>
      </div>
    `;
  });

  modalBody.innerHTML = dayDetailsHTML;
  modal.style.display = "block";
}

function closeModal() {
  document.getElementById("detailModal").style.display = "none";
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("detailModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

// Search functionality
document.querySelector(".search").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    getWeather();
  }
});
