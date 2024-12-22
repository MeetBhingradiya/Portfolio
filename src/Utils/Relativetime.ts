function getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const absDiff = Math.abs(diff);
    const seconds = Math.floor(absDiff / 1000);

    if (seconds < 60) {
        return diff < 0 ? `in ${seconds} seconds` : `${seconds} seconds ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return diff < 0 ? `in ${minutes} minutes` : `${minutes} minutes ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return diff < 0 ? `in ${hours} hours` : `${hours} hours ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
        return diff < 0 ? `in ${days} days` : `${days} days ago`;
    }

    // Future dates within the next 30 days
    if (diff < 0 && days <= 30) {
        return `in ${days} days`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
        return diff < 0 ? `in ${months} months` : `${months} months ago`;
    }

    const years = Math.floor(days / 365);
    return diff < 0 ? `in ${years} years` : `${years} years ago`;
}

export {
    getRelativeTime
}