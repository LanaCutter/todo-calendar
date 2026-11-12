import apiClient from "./services.js";

export default {
  getAll() {
    return apiClient.get("day-todos");
  },
  create(data) {
    return apiClient.post("day-todos", data);
  },
  update(id, data) {
    return apiClient.put(`day-todos/${id}`, data);
  },
  remove(id) {
    return apiClient.delete(`day-todos/${id}`);
  },
  setCompleted(id, data) {
    return apiClient.put(`day-todos/${id}/completion`, data);
  },
};
