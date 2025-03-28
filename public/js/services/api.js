import { AuthService } from './auth.js';

export class ApiService {
    constructor(authService) {
        this.baseUrl = '/api';
        this.authService = authService || new AuthService();
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.authService.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // First check if response is JSON
            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');
            const responseData = isJson ? await response.json() : await response.text();

            if (!response.ok) {
                const errorMessage = isJson
                    ? (responseData.message || 'Request failed')
                    : `Server returned ${response.status}: ${responseData.substring(0, 100)}...`;
                throw new Error(errorMessage);
            }

            if (!isJson) {
                console.warn(`Expected JSON response but got: ${contentType}`);
                return responseData;
            }

            return responseData;
        } catch (error) {
            console.error('API request failed:', {
                endpoint,
                error: error.message,
                url
            });

            // Handle specific error cases
            if (error.message.includes('Unexpected token')) {
                throw new Error('Server returned an invalid response. Please check the API endpoint.');
            }

            throw error;
        }
    }

    // Room methods
    async getAvailableRooms(filters = {}) {
        try {
            const query = new URLSearchParams(filters).toString();
            const response = await this.request(`/rooms/available?${query}`);

            // Ensure we always return an array
            if (!Array.isArray(response)) {
                if (response && typeof response === 'object') {
                    // If response is an object, try to extract rooms array
                    return response.rooms || response.data || [];
                }
                return [];
            }

            return response;
        } catch (error) {
            console.error('Error loading rooms:', error);
            return []; // Return empty array on error
        }
    }

    async loadRooms() {
        try {
            this.setState({ isLoading: true });

            // Always ensure we get an array
            const rooms = await this.props.apiService.getAvailableRooms(this.state.filters);

            this.setState({
                rooms: Array.isArray(rooms) ? rooms : [],
                isLoading: false
            });

        } catch (error) {
            console.error('Failed to load rooms:', error);
            this.setState({
                rooms: [],
                isLoading: false,
                error: 'Failed to load rooms. Please try again.'
            });
        }
    }

    getRoomDetails(roomId) {
        return this.request(`/rooms/${roomId}`);
    }

    // Booking methods
    createBooking(bookingData) {
        return this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }

    getCustomerBookings(customerId) {
        return this.request(`/bookings/customer/${customerId}`);
    }

    cancelBooking(bookingId) {
        return this.request(`/bookings/${bookingId}/cancel`, {
            method: 'PUT'
        });
    }

    // Renting methods
    createRentingFromBooking(bookingId, employeeId) {
        return this.request('/rentings/from-booking', {
            method: 'POST',
            body: JSON.stringify({ bookingId, employeeId })
        });
    }

    createDirectRenting(rentingData) {
        return this.request('/rentings', {
            method: 'POST',
            body: JSON.stringify(rentingData)
        });
    }

    getCustomerRentings(customerId) {
        return this.request(`/rentings/customer/${customerId}`);
    }

    completeRenting(rentingId) {
        return this.request(`/rentings/${rentingId}/complete`, {
            method: 'PUT'
        });
    }

    addPayment(rentingId, paymentData) {
        return this.request(`/rentings/${rentingId}/payment`, {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    getRentingPayments(rentingId) {
        return this.request(`/rentings/${rentingId}/payments`);
    }

    // Management methods
    getCustomers() {
        return this.request('/customers');
    }

    createCustomer(customerData) {
        return this.request('/customers', {
            method: 'POST',
            body: JSON.stringify(customerData)
        });
    }

    updateCustomer(customerId, customerData) {
        return this.request(`/customers/${customerId}`, {
            method: 'PUT',
            body: JSON.stringify(customerData)
        });
    }

    deleteCustomer(customerId) {
        return this.request(`/customers/${customerId}`, {
            method: 'DELETE'
        });
    }

    getEmployees() {
        return this.request('/employees');
    }

    createEmployee(employeeData) {
        return this.request('/employees', {
            method: 'POST',
            body: JSON.stringify(employeeData)
        });
    }

    updateEmployee(employeeId, employeeData) {
        return this.request(`/employees/${employeeId}`, {
            method: 'PUT',
            body: JSON.stringify(employeeData)
        });
    }

    deleteEmployee(employeeId) {
        return this.request(`/employees/${employeeId}`, {
            method: 'DELETE'
        });
    }

    getHotels() {
        return this.request('/hotels');
    }

    createHotel(hotelData) {
        return this.request('/hotels', {
            method: 'POST',
            body: JSON.stringify(hotelData)
        });
    }

    updateHotel(hotelId, hotelData) {
        return this.request(`/hotels/${hotelId}`, {
            method: 'PUT',
            body: JSON.stringify(hotelData)
        });
    }

    deleteHotel(hotelId) {
        return this.request(`/hotels/${hotelId}`, {
            method: 'DELETE'
        });
    }

    getHotelRooms(hotelId) {
        return this.request(`/hotels/${hotelId}/rooms`);
    }

    createRoom(roomData) {
        return this.request('/rooms', {
            method: 'POST',
            body: JSON.stringify(roomData)
        });
    }

    updateRoom(roomId, roomData) {
        return this.request(`/rooms/${roomId}`, {
            method: 'PUT',
            body: JSON.stringify(roomData)
        });
    }

    deleteRoom(roomId) {
        return this.request(`/rooms/${roomId}`, {
            method: 'DELETE'
        });
    }

    // View methods
    getAvailableRoomsByArea() {
        return this.request('/views/available-rooms-by-area');
    }

    getHotelCapacitySummary() {
        return this.request('/views/hotel-capacity-summary');
    }
}