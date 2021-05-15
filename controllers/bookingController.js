const Stripe = require('stripe');
const Tour = require('../modles/tourModel');
const User = require('../modles/userModel');
const Booking = require('../modles/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  const tour = await Tour.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://localhost:3000/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://localhost:3000/my-tours`,
    cancel_url: `${req.protocol}://localhost:3000/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'eur',
        quantity: 1,
      },
    ],
  });

  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.createBookingCheckOut = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;
//   if (!tour && !user && !price) return next();

//   await Booking.create({
//     tour,
//     user,
//     price,
//   });
//   res.redirect(req.originalUrl.split('?')[0]);
// });
const createBookingCheckOut = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].amount / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = Stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook error ${error.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckOut(event.data.object);

  res.status(200).json({
    received: true,
  });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
