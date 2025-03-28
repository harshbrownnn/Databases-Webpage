import { Router } from './router.js';
import { AuthService } from './services/auth.js';
import { ApiService } from './services/api.js';
import { HomePage } from './pages/home.js';
import { LoginPage } from './pages/login.js';
import { SearchPage } from './pages/search.js';
import { RoomDetailsPage } from './pages/room-details.js';
import { CustomerBookingsPage } from './pages/customer-bookings.js';
import { CustomerRentingsPage } from './pages/customer-rentings.js';
import { EmployeeDashboardPage } from './pages/employee-dashboard.js';
import { CreateRentingPage } from './pages/create-renting.js';
import { RentingDetailsPage } from './pages/renting-details.js';
import { ViewPaymentsPage } from './pages/view-payments.js';
import { ManageCustomersPage } from './pages/manage-customers.js';
import { ManageEmployeesPage } from './pages/manage-employees.js';
import { ManageHotelsPage } from './pages/manage-hotels.js';
import { ManageRoomsPage } from './pages/manage-rooms.js';

// Initialize services
const authService = new AuthService();
const apiService = new ApiService();

// Initialize router with pages
const router = new Router({
    home: new HomePage(apiService),
    login: new LoginPage(authService, apiService),
    search: new SearchPage(apiService),
    'room-details': new RoomDetailsPage(apiService),
    'customer-bookings': new CustomerBookingsPage(apiService),
    'customer-rentings': new CustomerRentingsPage(apiService),
    'employee-dashboard': new EmployeeDashboardPage(apiService),
    'create-renting': new CreateRentingPage(apiService),
    'renting-details': new RentingDetailsPage(apiService),
    'view-payments': new ViewPaymentsPage(apiService),
    'manage-customers': new ManageCustomersPage(apiService),
    'manage-employees': new ManageEmployeesPage(apiService),
    'manage-hotels': new ManageHotelsPage(apiService),
    'manage-rooms': new ManageRoomsPage(apiService)
}, authService);

// Check auth state on load
document.addEventListener('DOMContentLoaded', () => {
    authService.checkAuthState().then(user => {
        router.updateNavigation(user);
        router.navigate('home');
    });
});

// Handle navigation
document.addEventListener('click', e => {
    if (e.target.matches('[data-page]')) {
        e.preventDefault();
        const page = e.target.getAttribute('data-page');
        router.navigate(page);
    }
});

// Handle logout
document.addEventListener('click', e => {
    if (e.target.matches('[data-action="logout"]')) {
        e.preventDefault();
        authService.logout();
        router.navigate('login');
    }
});