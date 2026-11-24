import Foundation
import SwiftUI

/// Must match APP_GROUP in src/widgets/native.ts and the entitlement in app.json.
let appGroup = "group.com.blockstar.app"

/// Mirrors `WidgetSnapshot` in src/widgets/snapshot.ts.
struct Snapshot: Codable {
  struct Theme: Codable {
    let background, surface, primary, onPrimary, text, textMuted, accent: String
  }

  struct Strings: Codable {
    let next, today, progress, nothingNext, allDone, now, inPrefix, more, done, noEvents: String
  }

  struct Item: Codable, Hashable {
    let title: String
    let start: Double  // epoch ms
    let end: Double  // epoch ms (== start for point-in-time items)
    let time: String
    let day: String  // YYYY-MM-DD, local
    let duration: String

    var startDate: Date { Date(timeIntervalSince1970: start / 1000) }
    /// Point-in-time items still "finish" a moment after they start.
    var endDate: Date { Date(timeIntervalSince1970: max(end, start + 1) / 1000) }
  }

  let v: Int
  let generatedAt: Double
  let lang: String
  let dark: Bool
  let theme: Theme
  let strings: Strings
  let weekdays: [String]
  let items: [Item]

  static func load() -> Snapshot? {
    guard
      let json = UserDefaults(suiteName: appGroup)?.string(forKey: "snapshot"),
      let data = json.data(using: .utf8),
      let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data),
      snapshot.v == 1
    else { return nil }
    return snapshot
  }

  func today(at date: Date) -> [Item] {
    let key = dayKey(date)
    return items.filter { $0.day == key }
  }

  func remainingToday(at date: Date) -> [Item] {
    today(at: date).filter { $0.endDate > date }
  }

  /// The item happening now, or the next one to start.
  func next(at date: Date) -> (item: Item, ongoing: Bool)? {
    if let current = items.first(where: { $0.startDate <= date && date < $0.endDate }) {
      return (current, true)
    }
    if let upcoming = items.first(where: { $0.startDate > date }) {
      return (upcoming, false)
    }
    return nil
  }

  func progress(at date: Date) -> (done: Int, total: Int) {
    let list = today(at: date)
    return (list.filter { $0.endDate <= date }.count, list.count)
  }

  func dayLabel(at date: Date) -> String {
    let weekday = Calendar.current.component(.weekday, from: date) - 1  // 0 = Sunday
    let day = Calendar.current.component(.day, from: date)
    return "\(weekdays[weekday]) \(day)"
  }

  /// Shown in the widget gallery and before the app has written any data.
  static var sample: Snapshot {
    let now = Date()
    let base = Calendar.current.startOfDay(for: now)
    func item(_ title: String, _ h: Int, _ m: Int, _ minutes: Int) -> Item {
      let start = base.addingTimeInterval(TimeInterval(h * 3600 + m * 60))
      return Item(
        title: title,
        start: start.timeIntervalSince1970 * 1000,
        end: start.addingTimeInterval(TimeInterval(minutes * 60)).timeIntervalSince1970 * 1000,
        time: String(format: "%02d:%02d", h, m),
        day: dayKey(now),
        duration: "")
    }
    return Snapshot(
      v: 1, generatedAt: now.timeIntervalSince1970 * 1000, lang: "en", dark: true,
      theme: Theme(
        background: "#000000", surface: "#161618", primary: "#9A87E8", onPrimary: "#FFFFFF",
        text: "#FFFFFF", textMuted: "#8E8E93", accent: "#7F6EE0"),
      strings: Strings(
        next: "Next up", today: "Today", progress: "Progress", nothingNext: "Nothing planned",
        allDone: "All done for today", now: "Happening now", inPrefix: "in", more: "more",
        done: "done", noEvents: "No events today"),
      weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      items: [
        item("Study and prep.", 16, 0, 75), item("Groceries shopping", 17, 30, 60),
        item("Dinner with Amy", 18, 30, 150), item("Bedtime", 23, 0, 0),
      ])
  }
}

func dayKey(_ date: Date) -> String {
  let c = Calendar.current.dateComponents([.year, .month, .day], from: date)
  return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
}

extension Color {
  /// "#RRGGBB" → Color
  init(hex: String) {
    let cleaned = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
    var value: UInt64 = 0
    Scanner(string: cleaned).scanHexInt64(&value)
    self.init(
      red: Double((value >> 16) & 0xFF) / 255,
      green: Double((value >> 8) & 0xFF) / 255,
      blue: Double(value & 0xFF) / 255)
  }
}
