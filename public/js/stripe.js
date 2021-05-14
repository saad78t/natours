import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe(
  'pk_test_51IpvVdHH5HMILprOYrI1d3wsVeVUFOpRrcOBx4p3VJl2lCocajaTPFrq5sB2TDTS50TivxUXnv0jLf6BZBFAGbaa00IXdd4dPV'
);

export const bookTour = async (tourId) => {
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    showAlert('error', error);
  }
};
