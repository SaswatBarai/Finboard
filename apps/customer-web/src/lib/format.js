export function maskPan(pan) {
  if (!pan) {
    return "Not added";
  }

  return `${pan.slice(0, 2)}****${pan.slice(-4)}`;
}

export function maskPhone(phone) {
  if (!phone) {
    return "Not added";
  }

  return `${phone.slice(0, 3)}*****${phone.slice(-4)}`;
}

export function maskEmail(email) {
  if (!email) {
    return "Not added";
  }

  const [name, domain] = email.split("@");
  if (!domain) {
    return email;
  }

  return `${name.slice(0, 3)}${"*".repeat(Math.max(name.length - 3, 3))}@${domain}`;
}

export function formatDate(dateValue) {
  if (!dateValue) {
    return "Not added";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "Not added";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

