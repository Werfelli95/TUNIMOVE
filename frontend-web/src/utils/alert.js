import Swal from 'sweetalert2';

export const showConfirm = (title, text, confirmButtonText = 'Confirmer', cancelButtonText = 'Annuler') => {
    return Swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        customClass: {
            popup: 'tm-swal-popup',
            title: 'tm-swal-title',
            htmlContainer: 'tm-swal-text',
            actions: 'tm-swal-actions',
            confirmButton: 'tm-swal-confirm-btn',
            cancelButton: 'tm-swal-cancel-btn'
        },
        buttonsStyling: false
    }).then(result => result.isConfirmed);
};

export const showAlert = (title, text, icon = 'info') => {
    return Swal.fire({
        title,
        text,
        icon,
        confirmButtonText: 'OK',
        customClass: {
            popup: 'tm-swal-popup',
            title: 'tm-swal-title',
            htmlContainer: 'tm-swal-text',
            actions: 'tm-swal-actions',
            confirmButton: 'tm-swal-confirm-btn'
        },
        buttonsStyling: false
    });
};
