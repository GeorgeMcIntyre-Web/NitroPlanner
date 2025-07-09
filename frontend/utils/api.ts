import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        )

        const { access_token } = response.data
        localStorage.setItem('access_token', access_token)
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Equipment Digital Twin API
export async function getEquipmentList(companyId?: string) {
  const params = companyId ? { companyId } : undefined;
  const res = await api.get('/api/equipment', { params });
  return res.data;
}

export async function getEquipment(id: string) {
  const res = await api.get(`/api/equipment/${id}`);
  return res.data;
}

export async function createEquipment(data: any) {
  const res = await api.post('/api/equipment', data);
  return res.data;
}

export async function updateEquipment(id: string, data: any) {
  const res = await api.put(`/api/equipment/${id}`, data);
  return res.data;
}

export async function deleteEquipment(id: string) {
  await api.delete(`/api/equipment/${id}`);
}

export async function assignEquipmentToWorkUnit(equipmentId: string, workUnitId: string) {
  const res = await api.post(`/api/equipment/${equipmentId}/assign-workunit`, { workUnitId });
  return res.data;
}

export async function unassignEquipmentFromWorkUnit(equipmentId: string, workUnitId: string) {
  const res = await api.post(`/api/equipment/${equipmentId}/unassign-workunit`, { workUnitId });
  return res.data;
}

export default api 