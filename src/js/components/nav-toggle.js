const navToggle = document.querySelector('.toggle');
const headerNav = document.querySelector('.header__nav');

navToggle.addEventListener('click', handleToggle);

function handleToggle() {
	headerNav.classList.toggle('is-open');
}