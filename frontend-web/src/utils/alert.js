export const showConfirm = (title, text, confirmButtonText = 'Confirmer', cancelButtonText = 'Annuler') => {
    const message = [title, text, `${confirmButtonText} / ${cancelButtonText}`]
        .filter(Boolean)
        .join('\n\n');

    return Promise.resolve(window.confirm(message));
};

export const showAlert = (title, text, icon = 'info') => {
    const prefix = icon === 'error' ? 'Erreur' : icon === 'success' ? 'Succès' : title;
    const message = [prefix && prefix !== title ? `${prefix}: ${title}` : title, text]
        .filter(Boolean)
        .join('\n\n');

    window.alert(message);
    return Promise.resolve();
};
