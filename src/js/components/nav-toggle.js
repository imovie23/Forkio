const navToggle = document.querySelector('.toggle');
const headerNav = document.querySelector('.header__nav');

function handleToggle() {
	headerNav.classList.toggle('is-open');
}

const mqList = window.matchMedia('(min-width: 481px)');
mqList.addListener(screenTest);
screenTest(mqList);

function screenTest(e) {
	if (e.matches) {
		navToggle.removeEventListener('click', handleToggle);

		if (headerNav.classList.contains('is-open')) {
			headerNav.classList.remove('is-open');
		}

	} else {
		navToggle.addEventListener('click', handleToggle);
	}
}
