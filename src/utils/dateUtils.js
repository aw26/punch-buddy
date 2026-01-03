export const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    // Future date protection
    if (diffInSeconds < 0) return 'just now';

    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (diffInSeconds < 60) {
        return 'just now';
    } else if (minutes < 60) {
        return `${minutes}m ago`;
    } else if (hours < 24) {
        return `${hours}h ago`;
    } else if (days === 1) {
        return 'yesterday';
    } else if (days < 7) {
        return `${days}d ago`;
    } else if (days < 30) {
        return `${weeks}w ago`;
    } else {
        // "if it's over 30 days ago just omit the date" -> Returning empty string or maybe simplified date?
        // Let's return local date format just in case, or null? 
        // User instructions: "omit the date". I will return null and handle display login in component
        return null;
    }
};
