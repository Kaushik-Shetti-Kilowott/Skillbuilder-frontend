
export default function notificationsTransformer(data) {
  const keys = Object.keys(data).reverse();

  return keys.map(key => 
    data[key].map(notif => ({
      ...notif,
      month: notif.month.trim(),
      date : notif.createdAt,
      text: notif.message,
      image: notif.notifImageUrl,
    }))
  )
  .filter(ver => ver.length)
}
