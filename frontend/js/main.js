/**
 * JavaScript principal do front-end.
 * Adicione aqui apenas comportamentos necessários para a interface.
 */

document.addEventListener('DOMContentLoaded', function () {
    const dropdowns = document.querySelectorAll('.dropdown');

    function closeDropdowns(except) {
        dropdowns.forEach(function (dropdown) {
            if (dropdown !== except) {
                dropdown.classList.remove('open');
            }
        });
    }

    function getDropdownMenu(dropdown) {
        return dropdown.querySelector('.dropdown-teams, .dropdown-categories');
    }

    dropdowns.forEach(function (dropdown) {
        const toggle = dropdown.querySelector('.dropbtn');
        const menu = getDropdownMenu(dropdown);

        if (!toggle || !menu) {
            return;
        }

        toggle.addEventListener('click', function (event) {
            const href = toggle.getAttribute('href');
            const hasNavigation = href && href.trim() !== '' && href.trim() !== '#';

            if (hasNavigation) {
                // Menus that point to a real page (ex.: Equipes) keep the default navigation.
                closeDropdowns();
                return;
            }

            event.preventDefault();
            const isOpen = dropdown.classList.contains('open');
            closeDropdowns(dropdown);
            if (!isOpen) {
                dropdown.classList.add('open');
            }
        });

        // Close the dropdown after a navigation option is chosen.
        menu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                dropdown.classList.remove('open');
            });
        });
    });

    // Close open dropdowns when clicking outside the navbar.
    document.addEventListener('click', function (event) {
        const openDropdown = document.querySelector('.dropdown.open');
        if (openDropdown && !openDropdown.contains(event.target)) {
            openDropdown.classList.remove('open');
        }
    });

    // Close open dropdowns with the Escape key.
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeDropdowns();
        }
    });
});
