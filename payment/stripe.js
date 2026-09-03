const Stripe=require('stripe');

function stripeClient(){
 const secretKey=process.env.STRIPE_SECRET_KEY;
 if(!secretKey){const error=new Error('STRIPE_SECRET_KEY não configurada.');error.code='STRIPE_NOT_CONFIGURED';throw error;}
 return new Stripe(secretKey);
}
function baseUrl(){return String(process.env.PUBLIC_API_URL||'https://kzsite.onrender.com').replace(/\/$/,'');}
async function createCheckoutSession(order,{customerEmail}={}){
 const stripe=stripeClient(),apiUrl=baseUrl();
 const session=await stripe.checkout.sessions.create({
  mode:'payment',
  client_reference_id:order.orderId,
  customer_email:customerEmail||undefined,
  metadata:{orderId:order.orderId,productCode:order.productCode},
  line_items:[{price_data:{currency:String(order.currency||'BRL').toLowerCase(),product_data:{name:order.productName},unit_amount:Math.round(Number(order.amount)*100)},quantity:1}],
  success_url:`${apiUrl}/comercial/pedido/confirmacao.html?id=${encodeURIComponent(order.orderId)}&payment=success&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url:`${apiUrl}/comercial/pedido/confirmacao.html?id=${encodeURIComponent(order.orderId)}&payment=cancelled`
 });
 return {sessionId:session.id,checkoutUrl:session.url};
}
function verifyWebhook(payload,signature){
 const secret=process.env.STRIPE_WEBHOOK_SECRET;
 if(!secret){const error=new Error('STRIPE_WEBHOOK_SECRET não configurada.');error.code='STRIPE_WEBHOOK_NOT_CONFIGURED';throw error;}
 return stripeClient().webhooks.constructEvent(payload,signature,secret);
}
async function getCheckoutSession(sessionId){return stripeClient().checkout.sessions.retrieve(String(sessionId),{expand:['payment_intent']});}
module.exports={createCheckoutSession,verifyWebhook,getCheckoutSession};
