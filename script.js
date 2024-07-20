let coreCourses = [];
let semesterCourses = {};

document.addEventListener('DOMContentLoaded', () => {
    fetch('./coreCourses.json')
        .then(response => response.json())
        .then(data => {
            coreCourses = data;
            console.log('Core courses loaded:', coreCourses); // Debug log
            fetch('./courseDetails.json')
                .then(response => response.json())
                .then(data => {
                    initializeLocalStorage(data);
                    semesterCourses = data;
                    populateTables(getCourseDetails(), false);
                })
                .catch(error => console.error('Error loading the course details:', error));
        })
        .catch(error => console.error('Error loading core courses:', error));

    document.getElementById('search').addEventListener('input', filterCourses);
    document.getElementById('homeButton').addEventListener('click', toggleHomeView);
    document.getElementById('adminButton').addEventListener('click', toggleAdminView);
    document.getElementById('add-course-button').addEventListener('click', addCourse);

    document.getElementById('year-select').addEventListener('change', populateCourseDropdown);
    document.getElementById('semester-select').addEventListener('change', populateCourseDropdown);
    document.getElementById('addCourseForm').addEventListener('submit', handleAddCourseForm);
});

function initializeLocalStorage(courseDetails) {
    if (!localStorage.getItem('courseDetails')) {
        localStorage.setItem('courseDetails', JSON.stringify(courseDetails));
    }
    if (!localStorage.getItem('coreCourses')) {
        localStorage.setItem('coreCourses', JSON.stringify(coreCourses));
    }
}

function getCourseDetails() {
    return JSON.parse(localStorage.getItem('courseDetails'));
}

function saveCourseDetails(courseDetails) {
    localStorage.setItem('courseDetails', JSON.stringify(courseDetails));
}

function getCoreCourses() {
    return JSON.parse(localStorage.getItem('coreCourses'));
}

function saveCoreCourses(coreCourses) {
    localStorage.setItem('coreCourses', JSON.stringify(coreCourses));
}

function displayAvailableCourses() {
    const availableCoursesTable = document.getElementById('available-courses-table');
    availableCoursesTable.innerHTML = `
        <tr>
            <th>Course Code</th>
            <th>Course Name</th>
            <th>Credits</th>
            <th>Action</th>
        </tr>
    `;

    const coreCourses = getCoreCourses();
    const courseDetails = getCourseDetails();
    const allCourses = [...coreCourses, ...Object.values(courseDetails).flatMap(semester => Object.entries(semester).map(([courseCode, course]) => ({ courseCode, ...course })))];

    allCourses.forEach(course => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${course.courseCode}</td>
            <td>${course.name}</td>
            <td>${course.credits}</td>
            <td>
                <button onclick="confirmDeleteCourse('${course.courseCode}')">Delete</button>
            </td>
        `;
        availableCoursesTable.appendChild(row);
    });
}

function toggleAddCourseForm() {
    const form = document.getElementById('addCourseForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function toggleAvailableCourses() {
    const availableCoursesSection = document.getElementById('available-courses');
    if (availableCoursesSection.style.display === 'none') {
        displayAvailableCourses();
        availableCoursesSection.style.display = 'block';
    } else {
        availableCoursesSection.style.display = 'none';
    }
}

function confirmDeleteCourse(courseCode) {
    const confirmation = confirm("Are you sure you want to delete this course?");
    if (confirmation) {
        deleteCourse(courseCode);
    }
}

function deleteCourse(courseCode) {
    let coreCourses = getCoreCourses();
    coreCourses = coreCourses.filter(course => course.courseCode !== courseCode);
    saveCoreCourses(coreCourses);

    // Also delete from course details
    let courseDetails = getCourseDetails();
    Object.keys(courseDetails).forEach(semesterId => {
        if (courseDetails[semesterId][courseCode]) {
            delete courseDetails[semesterId][courseCode];
        }
    });
    saveCourseDetails(courseDetails);

    displayAvailableCourses();
}

function handleAddCourseForm(event) {
    event.preventDefault();

    const newCourse = {
        courseCode: document.getElementById('newCourseCode').value,
        courseName: document.getElementById('newCourseName').value,
        credits: parseInt(document.getElementById('newCredits').value),
        lectureContactHours: parseInt(document.getElementById('newLectureContactHours').value),
        labContactHours: parseInt(document.getElementById('newLabContactHours').value),
        prerequisite: document.getElementById('newPrerequisite').value,
        description: document.getElementById('newDescription').value,
        repeatability: document.getElementById('newRepeatability').value,
        note: document.getElementById('newNote').value,
        tccns: document.getElementById('newTccns').value,
        additionalFee: document.getElementById('newAdditionalFee').value
    };

    const coreCourses = getCoreCourses();
    coreCourses.push(newCourse);
    saveCoreCourses(coreCourses);
    displayAvailableCourses();

    // Hide the form after saving the course
    document.getElementById('addCourseForm').style.display = 'none';
}

function populateTables(courseDetails, showDeleteButtons) {
    let totalCredits = [0, 0, 0, 0];
    const semesters = ["semester1", "semester2", "semester3", "semester4", "semester5", "semester6", "semester7", "semester8"];
    const semesterNames = ["Semester 1 Fall", "Semester 2 Spring"];

    const yearsContainer = document.getElementById('years-container');
    yearsContainer.innerHTML = '';

    for (let year = 0; year < 4; year++) {
        const yearContainer = document.createElement('div');
        yearContainer.className = 'year-container';

        const yearLabel = document.createElement('div');
        yearLabel.className = 'year-label';
        yearLabel.textContent = `Year ${year + 1}`;
        yearContainer.appendChild(yearLabel);

        let semesterContainers = [];
        for (let sem = 0; sem < 2; sem++) {
            const semesterIndex = year * 2 + sem;
            const semesterContainer = document.createElement('div');
            semesterContainer.className = 'semester-container';

            const semesterHeader = document.createElement('h3');
            semesterHeader.textContent = semesterNames[sem];
            semesterContainer.appendChild(semesterHeader);

            const table = document.createElement('table');
            table.id = semesters[semesterIndex];
            if (sem === 1) {
                table.innerHTML = `<tr><th>Course Code</th><th>Course Name</th><th>Credits</th>${showDeleteButtons ? '<th>Action</th>' : ''}<th>Total</th></tr>`;
            } else {
                table.innerHTML = `<tr><th>Course Code</th><th>Course Name</th><th>Credits</th>${showDeleteButtons ? '<th>Action</th>' : ''}</tr>`;
            }
            semesterContainer.appendChild(table);

            semesterContainers.push(semesterContainer);
            yearContainer.appendChild(semesterContainer);
        }

        yearsContainer.appendChild(yearContainer);

        semesterContainers.forEach((semesterContainer, sem) => {
            const table = semesterContainer.querySelector('table');
            const semesterIndex = year * 2 + sem;
            let semesterCredits = 0;
            Object.entries(courseDetails[semesters[semesterIndex]]).forEach(([code, course]) => {
                if (code === 'CORE') {
                    const row = createCoreCourseRow(year, sem, showDeleteButtons);
                    table.appendChild(row);
                } else {
                    const row = createCourseRow(code, course, showDeleteButtons);
                    table.appendChild(row);
                }
                semesterCredits += course.credits;
            });

            totalCredits[year] += semesterCredits;

            const semesterRow = document.createElement('tr');
            const semesterHoursLabelCell = document.createElement('td');
            semesterHoursLabelCell.colSpan = 2;
            semesterHoursLabelCell.className = 'total-credits';
            semesterHoursLabelCell.textContent = `Semester ${sem + 1} Hours`;

            const semesterHoursCell = document.createElement('td');
            semesterHoursCell.className = 'total-credits semester-hours';
            semesterHoursCell.textContent = semesterCredits;

            const actionCell = document.createElement('td');
            semesterRow.appendChild(semesterHoursLabelCell);
            semesterRow.appendChild(semesterHoursCell);
            if (showDeleteButtons) semesterRow.appendChild(actionCell);

            if (sem === 1) {
                const totalCell = document.createElement('td');
                totalCell.className = 'total-credits year-total';
                totalCell.textContent = totalCredits[year];
                semesterRow.appendChild(totalCell);
            }

            table.appendChild(semesterRow);
        });

        const table1 = semesterContainers[0].querySelector('table');
        const table2 = semesterContainers[1].querySelector('table');
        const rows1 = table1.rows.length;
        const rows2 = table2.rows.length;
        const maxRows = Math.max(rows1, rows2);

        for (let i = rows1; i < maxRows; i++) {
            const emptyRow = document.createElement('tr');
            for (let j = 0; j < (showDeleteButtons ? 4 : 3); j++) {
                const emptyCell = document.createElement('td');
                emptyRow.appendChild(emptyCell);
            }
            table1.insertBefore(emptyRow, table1.lastChild);
        }

        for (let i = rows2; i < maxRows; i++) {
            const emptyRow = document.createElement('tr');
            for (let j = 0; j < (showDeleteButtons ? 5 : 4); j++) {  // Adjusted to match the columns
                const emptyCell = document.createElement('td');
                emptyRow.appendChild(emptyCell);
            }
            table2.insertBefore(emptyRow, table2.lastChild);
        }
    }

    totalCredits.forEach((credits, yearIndex) => {
        document.getElementById(['oneCredits', 'twoCredits', 'threeCredits', 'fourCredits'][yearIndex]).textContent = `Year ${yearIndex + 1} Credits: ${credits}`;
    });
}

function populateCourseDropdown() {
    const yearSelect = document.getElementById('year-select');
    const semesterSelect = document.getElementById('semester-select');
    const courseSelect = document.getElementById('course-select');

    const year = yearSelect.value;
    const semester = semesterSelect.value;

    if (year === "" || semester === "") {
        return;
    }

    const courseDetails = getCourseDetails();
    const semesterId = `semester${parseInt(year) * 2 + parseInt(semester) + 1}`;
    const existingCourses = courseDetails[semesterId] ? Object.keys(courseDetails[semesterId]) : [];

    courseSelect.innerHTML = '<option value="" disabled selected>Select Course</option>';
    coreCourses.concat(Object.values(semesterCourses[semesterId] || {})).forEach(course => {
        if (!existingCourses.includes(course.courseCode) && course.courseCode && course.courseName) {
            const option = document.createElement('option');
            option.value = course.courseCode;
            option.textContent = `${course.courseCode} - ${course.courseName}`;
            option.dataset.courseName = course.courseName;
            option.dataset.credits = course.credits;
            option.dataset.description = course.description;
            option.dataset.lectureContactHours = course.lectureContactHours;
            option.dataset.labContactHours = course.labContactHours;
            option.dataset.prerequisite = course.prerequisite;
            option.dataset.repeatability = course.repeatability;
            option.dataset.note = course.note;
            option.dataset.tccns = course.tccns;
            option.dataset.additionalFee = course.additionalFee;
            courseSelect.appendChild(option);
        }
    });
    console.log('Course dropdown populated'); // Debug log
}

function addCourse() {
    const year = document.getElementById('year-select').value;
    const semester = document.getElementById('semester-select').value;
    const courseCode = document.getElementById('course-select').value;
    const courseDetails = getCourseDetails();

    if (year === "" || semester === "" || courseCode === "") {
        alert("Please select all fields");
        return;
    }

    const course = coreCourses.find(c => c.courseCode === courseCode) || Object.values(semesterCourses[`semester${parseInt(year) * 2 + parseInt(semester) + 1}`] || {}).find(c => c.courseCode === courseCode);
    const semesterId = `semester${parseInt(year) * 2 + parseInt(semester) + 1}`;

    if (!courseDetails[semesterId]) {
        courseDetails[semesterId] = {};
    }

    courseDetails[semesterId][courseCode] = {
        name: course.courseName,
        credits: course.credits,
        description: course.description,
        lectureContactHours: course.lectureContactHours,
        labContactHours: course.labContactHours,
        prerequisite: course.prerequisite,
        repeatability: course.repeatability,
        note: course.note,
        tccns: course.tccns,
        additionalFee: course.additionalFee
    };

    saveCourseDetails(courseDetails);
    populateTables(courseDetails, isAdmin());
}

function createCourseRow(code, course, showDeleteButton) {
    const row = document.createElement('tr');
    const courseCodeCell = document.createElement('td');
    courseCodeCell.className = 'clickable';
    courseCodeCell.textContent = code;
    courseCodeCell.onclick = () => showModal(course);

    const courseNameCell = document.createElement('td');
    courseNameCell.className = 'clickable';
    courseNameCell.textContent = course.name;
    courseNameCell.onclick = () => showModal(course);

    const creditsCell = document.createElement('td');
    creditsCell.textContent = course.credits;

    const actionCell = document.createElement('td');
    if (showDeleteButton) {
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '✖'; // Cross button
        deleteButton.onclick = () => {
            deleteRow(row, code, course.credits);
        };
        actionCell.appendChild(deleteButton);

        const editButton = document.createElement('button');
        editButton.textContent = '✎'; // Edit button
        editButton.onclick = () => {
            openEditModal(code, course);
        };
        actionCell.appendChild(editButton);
    }
    row.appendChild(courseCodeCell);
    row.appendChild(courseNameCell);
    row.appendChild(creditsCell);
    if (showDeleteButton) row.appendChild(actionCell);

    return row;
}

function deleteRow(row, code, credits) {
    const table = row.closest('table');
    const semesterContainer = table.closest('.semester-container');
    const yearContainer = semesterContainer.closest('.year-container');
    const yearIndex = Array.from(yearContainer.parentElement.children).indexOf(yearContainer);
    const semesterIndex = Array.from(semesterContainer.parentElement.children).indexOf(semesterContainer);
    const semesterId = table.id;

    row.parentElement.removeChild(row);

    let courseDetails = getCourseDetails();
    delete courseDetails[semesterId][code];
    saveCourseDetails(courseDetails);

    updateCredits(table, yearIndex, semesterIndex, -credits);
}

function updateCredits(table, yearIndex, semesterIndex, creditChange) {
    const semesterCreditsCell = table.querySelector('.semester-hours');
    if (semesterCreditsCell) {
        let semesterCredits = parseInt(semesterCreditsCell.textContent);
        semesterCredits += creditChange;
        semesterCreditsCell.textContent = semesterCredits;
    }

    const totalCreditsCell = document.querySelectorAll('.year-total')[yearIndex];
    if (totalCreditsCell) {
        let totalCredits = parseInt(totalCreditsCell.textContent);
        totalCredits += creditChange;
        totalCreditsCell.textContent = totalCredits;

        const yearCreditsCell = document.getElementById(['oneCredits', 'twoCredits', 'threeCredits', 'fourCredits'][yearIndex]);
        if (yearCreditsCell) {
            let yearCredits = parseInt(yearCreditsCell.textContent.split(': ')[1]);
            yearCredits += creditChange;
            yearCreditsCell.textContent = `Year ${yearIndex + 1} Credits: ${yearCredits}`;
        }
    }
}

function createCoreCourseRow(year, sem, showDeleteButton) {
    const row = document.createElement('tr');

    const courseSelect = document.createElement('select');
    courseSelect.onchange = (event) => updateCoreCourse(event, row);

    const relevantCoreCourses = getRelevantCoreCourses(year, sem);
    relevantCoreCourses.forEach(coreCourse => {
        const option = document.createElement('option');
        option.value = coreCourse.courseCode;
        option.textContent = coreCourse.courseCode;
        option.dataset.courseName = coreCourse.courseName;
        option.dataset.credits = coreCourse.credits;
        option.dataset.description = coreCourse.description;
        option.dataset.lectureContactHours = coreCourse.lectureContactHours;
        option.dataset.labContactHours = coreCourse.labContactHours;
        option.dataset.prerequisite = coreCourse.prerequisite;
        option.dataset.repeatability = coreCourse.repeatability;
        option.dataset.note = coreCourse.note;
        option.dataset.tccns = coreCourse.tccns;
        option.dataset.additionalFee = coreCourse.additionalFee;
        courseSelect.appendChild(option);
    });

    const courseCodeCell = document.createElement('td');
    courseCodeCell.appendChild(courseSelect);
    row.appendChild(courseCodeCell);

    const courseNameCell = document.createElement('td');
    courseNameCell.className = 'core-course-name clickable';  
    courseNameCell.onclick = () => showModal({
        heading: courseSelect.selectedOptions[0].dataset.courseName,
        credits: courseSelect.selectedOptions[0].dataset.credits,
        description: courseSelect.selectedOptions[0].dataset.description,
        lectureContactHours: courseSelect.selectedOptions[0].dataset.lectureContactHours,
        labContactHours: courseSelect.selectedOptions[0].dataset.labContactHours,
        prerequisite: courseSelect.selectedOptions[0].dataset.prerequisite,
        repeatability: courseSelect.selectedOptions[0].dataset.repeatability,
        note: courseSelect.selectedOptions[0].dataset.note,
        tccns: courseSelect.selectedOptions[0].dataset.tccns,
        additionalFee: courseSelect.selectedOptions[0].dataset.additionalFee
    });  
    row.appendChild(courseNameCell);

    const creditsCell = document.createElement('td');
    creditsCell.className = 'core-course-credits';
    row.appendChild(creditsCell);

    const actionCell = document.createElement('td');
    if (showDeleteButton) {
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '✖'; // Cross button
        deleteButton.onclick = () => {
            deleteRow(row, courseSelect.selectedOptions[0].value, parseInt(courseSelect.selectedOptions[0].dataset.credits));
        };
        actionCell.appendChild(deleteButton);
    }
    if (showDeleteButton) row.appendChild(actionCell);

    if (courseSelect.options.length > 0) {
        courseSelect.selectedIndex = 0;
        courseSelect.dispatchEvent(new Event('change'));
    }

    return row;
}

function getRelevantCoreCourses(year, sem) {
    let excludedCourses = [];
    let additionalCourses = [];

    if (year === 1 && sem === 1) {
        excludedCourses = ["core",'CLAS 3374', 'PHIL 1301'];
    } else if (year === 3 || year === 4) { 
        excludedCourses = ["core",'DRAM 1310', 'MUSI 1307'];
    }

    let relevantCourses = coreCourses.filter(course => !excludedCourses.includes(course.courseCode));
    relevantCourses = relevantCourses.concat(coreCourses.filter(course => additionalCourses.includes(course.courseCode)));

    return relevantCourses;
}

function updateCoreCourse(event, row) {
    const selectedOption = event.target.selectedOptions[0];
    const courseName = selectedOption.dataset.courseName;
    const credits = selectedOption.dataset.credits;
    const description = selectedOption.dataset.description;  
    const lectureContactHours = selectedOption.dataset.lectureContactHours;
    const labContactHours = selectedOption.dataset.labContactHours;
    const prerequisite = selectedOption.dataset.prerequisite;
    const repeatability = selectedOption.dataset.repeatability;
    const note = selectedOption.dataset.note;
    const tccns = selectedOption.dataset.tccns;
    const additionalFee = selectedOption.dataset.additionalFee;  

    const courseNameCell = row.querySelector('.core-course-name');
    const creditsCell = row.querySelector('.core-course-credits');

    courseNameCell.textContent = courseName;
    creditsCell.textContent = credits;

    courseNameCell.onclick = () => showModal({
        heading: courseName,
        credits: credits,
        description: description,
        lectureContactHours: lectureContactHours,
        labContactHours: labContactHours,
        prerequisite: prerequisite,
        repeatability: repeatability,
        note: note,
        tccns: tccns,
        additionalFee: additionalFee
    });
}

function showModal(course) {
    document.getElementById('name').textContent = course.heading;
    document.getElementById('credits').textContent = `Credits: ${course.credits ? course.credits : ""}`;
    document.getElementById('lech').textContent = `Lecture Contact Hours: ${course.lectureContactHours ? course.lectureContactHours : ""}`;
    document.getElementById('lch').textContent = `Lab Contact Hours: ${course.labContactHours ? course.labContactHours : ""}`;
    document.getElementById('pre').textContent = `Prerequisite: ${course.prerequisite ? course.prerequisite : ""}`;
    document.getElementById('des').textContent = `Description: ${course.description || ""}`;
    document.getElementById('rep').textContent = `Repeatability: ${course.repeatability || ""}`;
    document.getElementById('note').textContent = `Note: ${course.note || ""}`;
    document.getElementById('tccns').textContent = `TCCNS: ${course.tccns || ""}`;
    document.getElementById('addFee').textContent = `Additional Fee: ${course.additionalFee || ""}`;

    document.getElementById('myModal').style.display = 'block';
}

const modal = document.getElementById('myModal');
const closeSpan = document.getElementsByClassName('close')[0];
closeSpan.onclick = () => modal.style.display = 'none';
window.onclick = event => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

function filterCourses() {
    const query = document.getElementById('search').value.toLowerCase();
    document.querySelectorAll('table tr').forEach(row => {
        const codeCell = row.children[0];
        const nameCell = row.children[1];
        if (codeCell && nameCell) {
            const codeText = codeCell.textContent.toLowerCase();
            const nameText = nameCell.textContent.toLowerCase();
            if (codeText.includes(query) || nameText.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

function downloadPDF() {
    const element = document.querySelector('.flex-container');
    html2canvas(element).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        pdf.save('course-plan.pdf');
    });
}

function toggleHomeView() {
    document.getElementById('adminButton').style.display = 'inline';
    document.getElementById('downloadButton').style.display = 'inline';
    document.getElementById('homeButton').style.display = 'none';
    document.getElementById('course-add-container').style.display = 'none';
    document.getElementById('available-courses').style.display = 'none';

    // Re-populate tables to hide delete buttons and the Action column
    const courseDetails = getCourseDetails();
    populateTables(courseDetails, false);
}

function toggleAdminView() {
    const key = prompt("Enter the admin key:");
    const correctKey = "admin123"; // Set the correct key here

    if (key === correctKey) {
        loadAdminView();
    } else {
        alert("Key not matched.");
    }
}

function loadAdminView() {
    document.getElementById('adminButton').style.display = 'none';
    document.getElementById('downloadButton').style.display = 'none';
    document.getElementById('homeButton').style.display = 'inline';
    document.getElementById('course-add-container').style.display = 'block';
    document.getElementById('showCoursesButton').style.display = 'block';

    // Re-populate tables to show delete buttons and the Action column
    const courseDetails = getCourseDetails();
    populateTables(courseDetails, true);
}

function isAdmin() {
    return document.getElementById('homeButton').style.display === 'inline';
}

function openEditModal(courseCode, course) {
    document.getElementById('editCourseCode').value = courseCode;
    document.getElementById('editCourseName').value = course.name;
    document.getElementById('editCredits').value = course.credits;
    document.getElementById('editLectureContactHours').value = course.lectureContactHours;
    document.getElementById('editLabContactHours').value = course.labContactHours;
    document.getElementById('editPrerequisite').value = course.prerequisite;
    document.getElementById('editDescription').value = course.description;
    document.getElementById('editRepeatability').value = course.repeatability;
    document.getElementById('editNote').value = course.note;
    document.getElementById('editTccns').value = course.tccns;
    document.getElementById('editAdditionalFee').value = course.additionalFee;

    document.getElementById('editModal').style.display = 'block';

    const form = document.getElementById('editCourseForm');
    form.onsubmit = function(event) {
        event.preventDefault();
        saveEditedCourse(courseCode);
    }
}

function saveEditedCourse(oldCourseCode) {
    const courseCode = document.getElementById('editCourseCode').value;
    const course = {
        courseCode: courseCode,
        name: document.getElementById('editCourseName').value,
        credits: parseInt(document.getElementById('editCredits').value),
        lectureContactHours: parseInt(document.getElementById('editLectureContactHours').value),
        labContactHours: parseInt(document.getElementById('editLabContactHours').value),
        prerequisite: document.getElementById('editPrerequisite').value,
        description: document.getElementById('editDescription').value,
        repeatability: document.getElementById('editRepeatability').value,
        note: document.getElementById('editNote').value,
        tccns: document.getElementById('editTccns').value,
        additionalFee: document.getElementById('editAdditionalFee').value
    };

    let courseDetails = getCourseDetails();

    Object.keys(courseDetails).forEach(semesterId => {
        if (courseDetails[semesterId][oldCourseCode]) {
            delete courseDetails[semesterId][oldCourseCode];
            courseDetails[semesterId][courseCode] = course;
        }
    });

    saveCourseDetails(courseDetails);
    populateTables(courseDetails, isAdmin());
    document.getElementById('editModal').style.display = 'none';
}

document.getElementById('editModalClose').onclick = () => {
    document.getElementById('editModal').style.display = 'none';
}
window.onclick = event => {
    if (event.target === document.getElementById('editModal')) {
        document.getElementById('editModal').style.display = 'none';
    }
}
