const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e5e7eb"/><path d="M145 95h110v110H145zM145 205l38-43 27 27 20-19 25 35" fill="none" stroke="#9ca3af" stroke-width="8" stroke-linejoin="round"/></svg>';

export const unavailableProductImage = `data:image/svg+xml,${encodeURIComponent(svg)}`;

export const showUnavailableProductImage = (event) => {
  if (event.currentTarget.src !== unavailableProductImage) {
    event.currentTarget.src = unavailableProductImage;
  }
};
