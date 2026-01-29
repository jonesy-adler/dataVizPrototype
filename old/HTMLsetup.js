function HTMLsetup(){
	const selectExhibit = document.getElementById("selectExhibit");

	exhibitNames.forEach(exhibit => {
		let option = document.createElement("option");
		option.value = exhibit;
		option.text = exhibit;
		selectExhibit.append(option);
	});

	let option = document.createElement("option");
	option.value = 'all';
	option.text = 'Compare all';
	selectExhibit.append(option);

	selectExhibit.onchange = (() => {
		changeExhibit(selectExhibit.value);
	});

	const selectTable = document.getElementById("selectTable");

	tableNames.forEach(table => {
		let option = document.createElement("option");
		option.value = table;
		option.text = table;
		selectTable.appendChild(option);
	});

	option = document.createElement("option");
	option.value = 'both';
	option.text = 'Compare both';
	selectTable.appendChild(option);

	selectTable.onchange = (() => {
		changeTable(selectTable.value);
	});

	const selectDay = document.getElementById("selectDay");
	dayNames.forEach(day => {
		let option = document.createElement("option");
		option.value = day;
		option.text = day;
		selectDay.appendChild(option);
	});

	selectDay.onchange = (() => {
		changeDay(selectDay.value);
	});

	const dayLabel = document.getElementById("dayLabel");

	const selectChart = document.getElementById("selectChart");

	selectChart.onchange = (() => {
		if (selectChart.value == 'byDayAndHour'){
			selectDay.style.visibility = 'visible';
			dayLabel.style.visibility = 'visible';
		} else {
			selectDay.style.visibility = 'hidden';
			dayLabel.style.visibility = 'hidden';
		}
		changeChart(selectChart.value);
	});

	const monthFilter = document.getElementById("monthFilter");
	const monthSelectDiv = document.getElementById("monthSelectDiv");
	const leftArrow = document.getElementById("leftArrow");
	const rightArrow = document.getElementById("rightArrow");

	monthFilter.onchange = (() => {
		monthView = monthFilter.checked;
		monthSelectDiv.style.visibility = monthView ? 'visible' : 'hidden';
		generateChart();
	});

	function changeMonth(direction){
		if (direction == "previous"){
			if (currentYear == startingYear && currentMonth == startingMonth){
				return;
			}
			currentMonth--;

			if (currentMonth == 0){
				currentMonth = 12;
				currentYear--;
			}
		} else if (direction == "next"){
			if (currentYear == endingYear && currentMonth == endingMonth){
				return;
			}
			currentMonth++;
			if (currentMonth == 13){
				currentMonth = 1;
				currentYear++;
			}
		}

		if (currentYear == startingYear && currentMonth == startingMonth){
			leftArrow.style.opacity = 0.25;
		} else {
			leftArrow.style.opacity = 1;
		}

		if (currentYear == endingYear && currentMonth == endingMonth){
			rightArrow.style.opacity = 0.25;
		} else {
			rightArrow.style.opacity = 1;
		}
				

		generateChart();
	}

	leftArrow.onclick = (() => {
		changeMonth('previous');
	});

	rightArrow.onclick = (() => {
		changeMonth('next');
	});
}

export {HTMLsetup};